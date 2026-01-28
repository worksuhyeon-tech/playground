# FlowClaim

보상시스템 기획용 플로우차트 & 테스트 시나리오 생성 앱

## 주요 기능

### 1. 업무 플로우차트 생성
- 시작/종료/프로세스/분기(Decision) 노드 지원
- 드래그 앤 드롭으로 위치 조정
- 자동 연결선 생성
- 담당 주체(고객/보상직원/시스템/외부기관) 표시

### 2. 분기 조건(Decision Node)
- 조건명 설정 (예: 접수완료 여부)
- 다중 분기 지원 (Yes/No, A/B/C 등)
- 각 분기별 다음 단계 매핑

### 3. AS-IS / TO-BE 비교
- 동일 프로젝트 내 AS-IS / TO-BE 플로우 관리
- 색상으로 구분
- 비교 모드 ON/OFF

### 4. 테스트 시나리오 자동 생성
- DFS(깊이 우선 탐색) 기반 경로 추출
- Branch Coverage 전략
- 최대 케이스 수 제한 (20/50/100)
- 자동 생성 항목:
  - TC_ID
  - 시나리오명
  - 커버 경로
  - 분기 조건 요약
  - 테스트 절차
  - 기대결과
  - 우선순위

### 5. 테스트 시나리오 편집
- 인라인 편집
- 우선순위/결과 상태 변경
- 정렬/필터/검색

### 6. 내보내기
- **Excel (.xlsx)** - 테스트 시나리오
- **PowerPoint (.pptx)** - 플로우차트 (개별 도형)
- **PNG** - 이미지
- **PDF** - 문서
- **JSON** - 백업/복원

### 7. 프로젝트 관리
- 다중 프로젝트 지원
- 버전 관리
- LocalStorage 기반 저장

## 설치 및 실행

```bash
# 의존성 설치
cd flowclaim
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Flowchart**: @xyflow/react (React Flow)
- **State Management**: Zustand
- **Excel Export**: SheetJS (xlsx)
- **PPT Export**: PptxGenJS
- **PDF/PNG Export**: html2canvas + jsPDF

## 화면 구성

```
+------------------+-------------------------+------------------+
|                  |        Header           |                  |
|    Sidebar       | (탭: 플로우/시나리오/설명) |                  |
|   (프로젝트      +-------------------------+   Step Detail    |
|    목록)         |                         |     Panel        |
|                  |    Flow Canvas /        |   (선택 시)      |
|                  |    Test Scenarios /     |                  |
|                  |    Description          |                  |
+------------------+-------------------------+------------------+
```

## 사용 방법

1. **로그인**: 이름, 이메일, 부서 입력 (또는 데모 계정)
2. **프로젝트 생성**: 좌측 사이드바에서 + 버튼 클릭
3. **단계 추가**: 상단 툴바에서 시작/프로세스/분기/종료 클릭
4. **단계 편집**: 노드 클릭 후 우측 패널에서 수정
5. **연결**: 노드 핸들을 드래그하여 다른 노드에 연결
6. **시나리오 생성**: "테스트 시나리오" 탭에서 "시나리오 생성" 클릭
7. **내보내기**: 상단 "내보내기" 버튼에서 원하는 형식 선택

## 데이터 구조

```typescript
interface FlowStep {
  id: string;
  name: string;
  description: string;
  actor: 'customer' | 'staff' | 'system' | 'external' | 'other';
  type: 'start' | 'end' | 'process' | 'decision';
  nextStepIds: string[];
  branches?: BranchCondition[];
  conditionName?: string;
  position: { x: number; y: number };
  flowType: 'as-is' | 'to-be' | 'both';
}

interface TestScenario {
  id: string;
  name: string;
  path: string[];
  pathDescription: string;
  branchConditions: { stepId: string; condition: string; value: string }[];
  preconditions: string;
  testData: string;
  steps: string;
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  result: 'pass' | 'fail' | 'pending' | 'blocked';
  notes: string;
}
```

## 라이선스

Internal Use Only - 내부 직원 전용 서비스
