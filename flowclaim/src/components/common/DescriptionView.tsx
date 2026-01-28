import React, { useMemo } from 'react';
import { FileText, Copy, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateFlowDescription } from '../../utils/scenarioGenerator';

export function DescriptionView() {
  const { getCurrentProject } = useStore();
  const project = getCurrentProject();
  const [copied, setCopied] = React.useState(false);

  const description = useMemo(() => {
    if (!project || project.steps.length === 0) {
      return null;
    }
    return generateFlowDescription(project.steps);
  }, [project?.steps]);

  const handleCopy = async () => {
    if (description) {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500">
        <p>프로젝트를 선택하세요</p>
      </div>
    );
  }

  if (!description) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg mb-2">설명 텍스트를 생성할 수 없습니다</p>
          <p className="text-sm">플로우차트에 단계를 추가하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
            <p className="text-slate-500">업무 흐름 설명 문서</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? '복사됨!' : '복사'}
          </button>
        </div>

        {/* Description content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="prose prose-slate max-w-none">
            {description.split('\n').map((line, index) => {
              // Parse markdown-like syntax
              if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-xl font-bold text-slate-900 mt-6 mb-4 first:mt-0">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg font-semibold text-slate-800 mt-5 mb-3">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} className="font-semibold text-slate-800 mb-2">
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={index} className="text-slate-600 ml-4">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              if (line.match(/^\d+\./)) {
                // Parse bold text within numbered items
                const parts = line.split(/(\*\*[^*]+\*\*)/);
                return (
                  <p key={index} className="text-slate-600 mb-2 pl-4">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-slate-800">{part.replace(/\*\*/g, '')}</strong>;
                      }
                      return part;
                    })}
                  </p>
                );
              }
              if (line.includes('→')) {
                return (
                  <p key={index} className="text-slate-500 text-sm mb-2 font-mono bg-slate-50 p-2 rounded">
                    {line}
                  </p>
                );
              }
              if (line.trim() === '') {
                return <br key={index} />;
              }
              return (
                <p key={index} className="text-slate-600 mb-2">
                  {line}
                </p>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-400">
          생성일: {new Date().toLocaleDateString('ko-KR')} | FlowClaim
        </div>
      </div>
    </div>
  );
}
