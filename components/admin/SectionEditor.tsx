'use client';

/**
 * SectionEditor Component
 * 
 * Editor for the 9 review sections:
 * 1. Opening Hook
 * 2. Story Overview
 * 3. Performance Analysis
 * 4. Technical Breakdown
 * 5. Music & Audio
 * 6. Highs & Lows
 * 7. Audience Fit
 * 8. Comparison Context
 * 9. Final Verdict
 */

import React, { useState, useCallback } from 'react';

interface ReviewSection {
  id: string;
  name: string;
  description: string;
  content: string;
  isGenerated: boolean;
  generatedBy?: 'template' | 'ai' | 'human';
  lastUpdated?: string;
}

interface SectionEditorProps {
  movieId: string;
  movieTitle: string;
  sections: ReviewSection[];
  onSave: (sections: ReviewSection[]) => Promise<void>;
  onRegenerate: (sectionId: string, type: 'template' | 'ai') => Promise<string>;
  isLoading?: boolean;
}

const SECTION_DEFINITIONS = [
  { id: 'opening_hook', name: 'Opening Hook', description: 'Engaging intro that captures attention' },
  { id: 'story_overview', name: 'Story Overview', description: 'Plot summary without spoilers' },
  { id: 'performance_analysis', name: 'Performance Analysis', description: 'Lead and supporting actor performances' },
  { id: 'technical_breakdown', name: 'Technical Breakdown', description: 'Direction, cinematography, editing' },
  { id: 'music_audio', name: 'Music & Audio', description: 'Songs, BGM, and sound design' },
  { id: 'highs_lows', name: 'Highs & Lows', description: 'What works and what does not' },
  { id: 'audience_fit', name: 'Audience Fit', description: 'Who should watch this film' },
  { id: 'comparison_context', name: 'Comparison Context', description: 'Similar films and director\'s filmography' },
  { id: 'final_verdict', name: 'Final Verdict', description: 'Overall assessment and recommendation' },
];

export function SectionEditor({
  movieId,
  movieTitle,
  sections,
  onSave,
  onRegenerate,
  isLoading = false,
}: SectionEditorProps) {
  const [editedSections, setEditedSections] = useState<ReviewSection[]>(
    SECTION_DEFINITIONS.map(def => {
      const existing = sections.find(s => s.id === def.id);
      return existing || {
        id: def.id,
        name: def.name,
        description: def.description,
        content: '',
        isGenerated: false,
      };
    })
  );

  const [activeSection, setActiveSection] = useState<string>(SECTION_DEFINITIONS[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSection = useCallback((sectionId: string, content: string) => {
    setEditedSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, content, lastUpdated: new Date().toISOString() }
        : s
    ));
    setHasChanges(true);
  }, []);

  const handleRegenerate = async (sectionId: string, type: 'template' | 'ai') => {
    setRegeneratingSection(sectionId);
    try {
      const newContent = await onRegenerate(sectionId, type);
      setEditedSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              content: newContent, 
              isGenerated: true, 
              generatedBy: type,
              lastUpdated: new Date().toISOString() 
            }
          : s
      ));
      setHasChanges(true);
    } catch (error) {
      console.error('Error regenerating section:', error);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSections);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving sections:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateAll = async (type: 'template' | 'ai') => {
    for (const section of SECTION_DEFINITIONS) {
      if (regeneratingSection) break;
      await handleRegenerate(section.id, type);
    }
  };

  const currentSection = editedSections.find(s => s.id === activeSection);
  const completedCount = editedSections.filter(s => s.content.length > 50).length;

  return (
    <div className="section-editor grid grid-cols-12 gap-4">
      {/* Sidebar - Section List */}
      <div className="col-span-4 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Review Sections</h3>
          <span className="text-sm text-gray-500">
            {completedCount}/{SECTION_DEFINITIONS.length}
          </span>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => regenerateAll('template')}
            disabled={isLoading || !!regeneratingSection}
            className="flex-1 px-2 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded transition-colors disabled:opacity-50"
          >
            📝 Template All
          </button>
          <button
            onClick={() => regenerateAll('ai')}
            disabled={isLoading || !!regeneratingSection}
            className="flex-1 px-2 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200 rounded transition-colors disabled:opacity-50"
          >
            🤖 AI All
          </button>
        </div>

        {/* Section list */}
        <div className="space-y-1">
          {SECTION_DEFINITIONS.map((def, index) => {
            const section = editedSections.find(s => s.id === def.id);
            const hasContent = (section?.content.length || 0) > 50;
            const isActive = activeSection === def.id;
            
            return (
              <button
                key={def.id}
                onClick={() => setActiveSection(def.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{index + 1}.</span>
                    <span className={`font-medium ${hasContent ? '' : 'text-gray-400'}`}>
                      {def.name}
                    </span>
                  </span>
                  <span>
                    {regeneratingSection === def.id ? (
                      <span className="animate-spin">⏳</span>
                    ) : hasContent ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-300">○</span>
                    )}
                  </span>
                </div>
                {section?.generatedBy && (
                  <span className={`text-xs mt-1 inline-block px-1.5 py-0.5 rounded ${
                    section.generatedBy === 'ai' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : section.generatedBy === 'template'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {section.generatedBy}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Editor */}
      <div className="col-span-8 space-y-4">
        {currentSection && (
          <>
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{currentSection.name}</h2>
                <p className="text-sm text-gray-500">{currentSection.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRegenerate(currentSection.id, 'template')}
                  disabled={isLoading || !!regeneratingSection}
                  className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded transition-colors disabled:opacity-50"
                >
                  {regeneratingSection === currentSection.id ? 'Generating...' : '📝 Template'}
                </button>
                <button
                  onClick={() => handleRegenerate(currentSection.id, 'ai')}
                  disabled={isLoading || !!regeneratingSection}
                  className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200 rounded transition-colors disabled:opacity-50"
                >
                  {regeneratingSection === currentSection.id ? 'Generating...' : '🤖 AI Generate'}
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="relative">
              <textarea
                value={currentSection.content}
                onChange={(e) => updateSection(currentSection.id, e.target.value)}
                placeholder={`Write the ${currentSection.name.toLowerCase()} for ${movieTitle}...`}
                className="w-full h-64 p-4 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isLoading || !!regeneratingSection}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {currentSection.content.length} characters
              </div>
            </div>

            {/* Section metadata */}
            {currentSection.lastUpdated && (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(currentSection.lastUpdated).toLocaleString()}
              </p>
            )}
          </>
        )}

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          {hasChanges && (
            <span className="text-sm text-yellow-600 self-center">
              ⚠️ Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save All Sections'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SectionEditor;

