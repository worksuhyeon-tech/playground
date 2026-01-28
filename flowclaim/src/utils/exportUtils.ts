import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { FlowStep, TestScenario, Project } from '../types';
import { ACTOR_LABELS, STEP_TYPE_LABELS, PRIORITY_LABELS, TEST_RESULT_LABELS } from '../types';

/**
 * Export test scenarios to Excel
 */
export async function exportToExcel(
  scenarios: TestScenario[],
  projectName: string
): Promise<void> {
  const data = scenarios.map((s, index) => ({
    'TC_ID': `TC-${String(index + 1).padStart(3, '0')}`,
    '시나리오명': s.name,
    '커버 경로': s.pathDescription,
    '분기 조건 요약': s.branchConditions.map((b) => `${b.condition}=${b.value}`).join('; '),
    '사전조건': s.preconditions,
    '테스트 데이터': s.testData,
    '테스트 절차': s.steps,
    '기대결과': s.expectedResult,
    '우선순위': PRIORITY_LABELS[s.priority],
    '담당자': s.assignee,
    '결과': TEST_RESULT_LABELS[s.result],
    '비고': s.notes,
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 },  // TC_ID
    { wch: 30 },  // 시나리오명
    { wch: 40 },  // 커버 경로
    { wch: 30 },  // 분기 조건 요약
    { wch: 25 },  // 사전조건
    { wch: 20 },  // 테스트 데이터
    { wch: 40 },  // 테스트 절차
    { wch: 25 },  // 기대결과
    { wch: 10 },  // 우선순위
    { wch: 15 },  // 담당자
    { wch: 10 },  // 결과
    { wch: 20 },  // 비고
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '테스트 시나리오');
  
  XLSX.writeFile(workbook, `${projectName}_테스트시나리오.xlsx`);
}

/**
 * Export flowchart to PNG
 */
export async function exportToPNG(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
  });
  
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Export flowchart to PDF
 */
export async function exportToPDF(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  // Calculate PDF dimensions (A4 landscape or portrait based on aspect ratio)
  const isLandscape = imgWidth > imgHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const finalWidth = imgWidth * ratio;
  const finalHeight = imgHeight * ratio;
  
  const x = (pdfWidth - finalWidth) / 2;
  const y = (pdfHeight - finalHeight) / 2;
  
  pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
  pdf.save(`${filename}.pdf`);
}

/**
 * Export flowchart to PowerPoint
 */
export async function exportToPPTX(
  steps: FlowStep[],
  projectName: string,
  projectDescription: string
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.title = projectName;
  pptx.author = 'FlowClaim';
  
  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(projectName, {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1,
    fontSize: 36,
    bold: true,
    color: '1e3a5f',
    align: 'center',
  });
  titleSlide.addText(projectDescription || '업무 플로우차트', {
    x: 0.5,
    y: 3.2,
    w: '90%',
    h: 0.5,
    fontSize: 18,
    color: '666666',
    align: 'center',
  });
  titleSlide.addText(new Date().toLocaleDateString('ko-KR'), {
    x: 0.5,
    y: 4,
    w: '90%',
    h: 0.3,
    fontSize: 12,
    color: '999999',
    align: 'center',
  });
  
  // Flowchart slide
  const flowSlide = pptx.addSlide();
  flowSlide.addText('업무 플로우차트', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: '1e3a5f',
  });
  
  // Calculate layout
  const startX = 1;
  const startY = 1.2;
  const stepWidth = 1.8;
  const stepHeight = 0.8;
  const gapX = 0.5;
  const gapY = 0.5;
  const maxPerRow = 5;
  
  // Color mapping by step type
  const typeColors: Record<string, string> = {
    start: '22c55e',     // green
    end: 'ef4444',       // red
    process: '3b82f6',   // blue
    decision: 'f59e0b',  // amber
  };
  
  // Shape mapping by step type
  const typeShapes: Record<string, 'ellipse' | 'rect' | 'diamond'> = {
    start: 'ellipse',
    end: 'ellipse',
    process: 'rect',
    decision: 'diamond',
  };
  
  // Draw steps
  steps.forEach((step, index) => {
    const row = Math.floor(index / maxPerRow);
    const col = index % maxPerRow;
    
    const x = startX + col * (stepWidth + gapX);
    const y = startY + row * (stepHeight + gapY + 0.3);
    
    const shapeType = typeShapes[step.type] || 'rect';
    const fillColor = typeColors[step.type] || '3b82f6';
    
    // Add shape
    if (shapeType === 'ellipse') {
      flowSlide.addShape('ellipse', {
        x,
        y,
        w: stepWidth,
        h: stepHeight,
        fill: { color: fillColor },
        line: { color: fillColor, width: 1 },
      });
    } else if (shapeType === 'diamond') {
      flowSlide.addShape('diamond', {
        x,
        y,
        w: stepWidth,
        h: stepHeight,
        fill: { color: fillColor },
        line: { color: fillColor, width: 1 },
      });
    } else {
      flowSlide.addShape('rect', {
        x,
        y,
        w: stepWidth,
        h: stepHeight,
        fill: { color: fillColor },
        line: { color: fillColor, width: 1 },
        rectRadius: 0.1,
      });
    }
    
    // Add text
    flowSlide.addText(step.name, {
      x,
      y,
      w: stepWidth,
      h: stepHeight,
      fontSize: 10,
      color: 'ffffff',
      align: 'center',
      valign: 'middle',
      bold: true,
    });
    
    // Add actor label
    flowSlide.addText(ACTOR_LABELS[step.actor] || step.actor, {
      x,
      y: y + stepHeight + 0.05,
      w: stepWidth,
      h: 0.25,
      fontSize: 8,
      color: '666666',
      align: 'center',
    });
  });
  
  // Step details slide
  const detailSlide = pptx.addSlide();
  detailSlide.addText('단계 상세', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: '1e3a5f',
  });
  
  // Create table data
  const tableData: Array<Array<{ text: string; options?: object }>> = [
    [
      { text: '단계명', options: { bold: true, fill: { color: 'e2e8f0' } } },
      { text: '유형', options: { bold: true, fill: { color: 'e2e8f0' } } },
      { text: '담당자', options: { bold: true, fill: { color: 'e2e8f0' } } },
      { text: '설명', options: { bold: true, fill: { color: 'e2e8f0' } } },
    ],
  ];
  
  steps.forEach((step) => {
    tableData.push([
      { text: step.name },
      { text: STEP_TYPE_LABELS[step.type] || step.type },
      { text: ACTOR_LABELS[step.actor] || step.actor },
      { text: step.description || '-' },
    ]);
  });
  
  detailSlide.addTable(tableData, {
    x: 0.5,
    y: 1,
    w: 9,
    colW: [2.5, 1.5, 1.5, 3.5],
    fontSize: 10,
    border: { type: 'solid', pt: 0.5, color: 'cccccc' },
    align: 'left',
    valign: 'middle',
  });
  
  // Save file
  await pptx.writeFile({ fileName: `${projectName}_플로우차트.pptx` });
}

/**
 * Export flow data as JSON
 */
export function exportToJSON(project: Project): void {
  const dataStr = JSON.stringify(project, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = `${project.name}_data.json`;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import flow data from JSON
 */
export async function importFromJSON(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data as Project);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
