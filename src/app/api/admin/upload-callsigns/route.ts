/**
 * POST /api/admin/upload-callsigns
 * Excel 파일로 유사호출부호 데이터 일괄 업로드
 * 
 * 요청:
 *   - Content-Type: multipart/form-data
 *   - file: Excel 파일 (.xlsx)
 * 
 * 응답:
 *   - 성공: { success: true, total: N, inserted: N, updated: N }
 *   - 실패: { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ExcelRow {
  airline_code: string;
  callsign_pair: string;
  my_callsign: string;
  other_callsign: string;
  other_airline_code?: string;
  error_type?: string;
  sub_error?: string;
  risk_level?: string;
  similarity?: string;
  occurrence_count?: number;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 체크
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Excel 파일(.xlsx, .xls)만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 업로드 기록 생성
    const uploadRecord = await query(
      `INSERT INTO file_uploads (file_name, file_size, uploaded_by, status)
       VALUES ($1, $2, $3, 'processing')
       RETURNING id`,
      [file.name, file.size, payload.userId]
    );
    const uploadId = uploadRecord.rows[0].id;

    try {
      // 파일 데이터 읽기
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // xlsx 라이브러리 동적 import
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // 첫 번째 시트 읽기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // JSON으로 변환 (헤더 포함)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        throw new Error('데이터가 없습니다.');
      }

      // 헤더와 데이터 분리
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);

      let insertedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      // 각 행 처리
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // 빈 행 스킵
        if (!row || row.length === 0 || !row[2]) continue;

        try {
          // 실제 Excel 구조에 맞게 열 매핑
          // 컬럼: 시작일시(0), 종료일시(1), 편명1(2), 편명2(3), 편명1|편명2(4), 
          //       항공사구분(5), 항공사한글명(6), 섹터(7), 항공사코드(8),
          //       ...유사도(13), ...오류발생가능성(19), 권고사항(21)
          
          const callsign1 = String(row[2] || '').trim();
          const callsign2 = String(row[3] || '').trim();
          const airlineCode = String(row[5] || '').trim();
          
          // 항공사 코드가 우리 시스템의 항공사 코드에 매핑되는지 확인
          // EOK -> EOK, VJC -> (외항사), UAE -> (외항사) 등
          // 우리 항공사만 필터링 (KAL, AAR, JJA, JNA, TWB, ABL, ASV, EOK, FGW)
          const domesticAirlines = ['KAL', 'AAR', 'JJA', 'JNA', 'TWB', 'ABL', 'ASV', 'EOK', 'FGW'];
          
          // 편명1과 편명2에서 항공사 코드 추출 (예: KAL852 -> KAL)
          const airlineCode1 = callsign1.replace(/[0-9]/g, '').trim();
          const airlineCode2 = callsign2.replace(/[0-9]/g, '').trim();
          
          // 편명1 또는 편명2 중 하나라도 국내 항공사인지 확인
          const isCallsign1Domestic = domesticAirlines.includes(airlineCode1);
          const isCallsign2Domestic = domesticAirlines.includes(airlineCode2);
          
          // 둘 다 국내 항공사가 아니면 스킵
          if (!isCallsign1Domestic && !isCallsign2Domestic) {
            continue;
          }
          
          // 국내 항공사를 my_callsign으로, 나머지를 other_callsign으로 설정
          let myAirlineCode, myCallsign, otherCallsign, otherAirlineCode;
          if (isCallsign1Domestic) {
            myAirlineCode = airlineCode1;
            myCallsign = callsign1;
            otherCallsign = callsign2;
            otherAirlineCode = airlineCode2;
          } else {
            myAirlineCode = airlineCode2;
            myCallsign = callsign2;
            otherCallsign = callsign1;
            otherAirlineCode = airlineCode1;
          }
          
          const rowData: ExcelRow = {
            airline_code: myAirlineCode,
            callsign_pair: `${myCallsign} | ${otherCallsign}`,
            my_callsign: myCallsign,
            other_callsign: otherCallsign,
            other_airline_code: otherAirlineCode || undefined,
            error_type: undefined, // Excel에 없음
            sub_error: undefined,  // Excel에 없음
            risk_level: row[19] ? String(row[19]).trim() : '낮음', // 오류발생가능성
            similarity: row[13] ? String(row[13]).trim() : '낮음', // 유사도
            occurrence_count: 0, // 초기값
          };

          // 필수 필드 검증
          if (!rowData.airline_code || !rowData.callsign_pair || !rowData.my_callsign || !rowData.other_callsign) {
            errors.push(`행 ${i + 2}: 필수 필드 누락`);
            continue;
          }

          // 항공사 ID 조회
          const airlineResult = await query(
            'SELECT id FROM airlines WHERE code = $1',
            [rowData.airline_code]
          );

          if (airlineResult.rows.length === 0) {
            errors.push(`행 ${i + 2}: 항공사 코드(${rowData.airline_code})를 찾을 수 없습니다.`);
            continue;
          }

          const airlineId = airlineResult.rows[0].id;

          // UPSERT (존재하면 업데이트, 없으면 삽입)
          const result = await query(
            `INSERT INTO callsigns 
              (airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
               other_airline_code, error_type, sub_error, risk_level, similarity,
               occurrence_count, file_upload_id, uploaded_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
             ON CONFLICT (airline_code, callsign_pair)
             DO UPDATE SET
               my_callsign = EXCLUDED.my_callsign,
               other_callsign = EXCLUDED.other_callsign,
               other_airline_code = EXCLUDED.other_airline_code,
               error_type = EXCLUDED.error_type,
               sub_error = EXCLUDED.sub_error,
               risk_level = EXCLUDED.risk_level,
               similarity = EXCLUDED.similarity,
               occurrence_count = EXCLUDED.occurrence_count,
               updated_at = NOW()
             RETURNING (xmax = 0) AS inserted`,
            [
              airlineId,
              rowData.airline_code,
              rowData.callsign_pair,
              rowData.my_callsign,
              rowData.other_callsign,
              rowData.other_airline_code,
              rowData.error_type,
              rowData.sub_error,
              rowData.risk_level,
              rowData.similarity,
              rowData.occurrence_count || 0,
              uploadId,
            ]
          );

          if (result.rows[0].inserted) {
            insertedCount++;
          } else {
            updatedCount++;
          }
        } catch (rowError) {
          errors.push(`행 ${i + 2}: ${rowError instanceof Error ? rowError.message : '처리 오류'}`);
        }
      }

      // 업로드 기록 업데이트
      await query(
        `UPDATE file_uploads 
         SET status = 'completed', 
             total_rows = $1, 
             success_count = $2, 
             failed_count = $3,
             error_message = $4,
             processed_at = NOW()
         WHERE id = $5`,
        [rows.length, insertedCount + updatedCount, errors.length, errors.join('\n'), uploadId]
      );

      return NextResponse.json({
        success: true,
        total: rows.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: errors.length,
        errors: errors.slice(0, 10), // 최대 10개만 반환
      });
    } catch (parseError) {
      // 파싱 실패 시 업로드 기록 업데이트
      await query(
        `UPDATE file_uploads 
         SET status = 'failed', 
             error_message = $1
         WHERE id = $2`,
        [parseError instanceof Error ? parseError.message : '파일 파싱 오류', uploadId]
      );

      throw parseError;
    }
  } catch (error) {
    console.error('Excel 업로드 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Excel 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
