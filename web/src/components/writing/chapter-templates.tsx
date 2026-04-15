"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChapterTemplate } from "@/types/writing";
import { PREDEFINED_TEMPLATES } from "@/lib/writing-utils";

const TEMPLATES_STORAGE_KEY = 'writing-templates';

interface ChapterTemplatesProps {
  onApplyTemplate: (template: ChapterTemplate) => void;
}

export function ChapterTemplates({ onApplyTemplate }: ChapterTemplatesProps) {
  const t = useTranslations("ChapterTemplates");
  const [templates, setTemplates] = useState<ChapterTemplate[]>([...PREDEFINED_TEMPLATES]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTemplate, setCustomTemplate] = useState({
    name: "",
    description: "",
    content: "",
  });

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        const customTemplates = JSON.parse(stored) as ChapterTemplate[];
        setTemplates(prev => [...prev, ...customTemplates]);
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }, []);

  function saveCustomTemplates(customTemplates: ChapterTemplate[]) {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
      alert(t("alertStorageLimit"));
    }
  }

  function handleApplyTemplate() {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onApplyTemplate(template);
      setSelectedTemplateId("");
    }
  }

  function handleCreateCustomTemplate() {
    if (!customTemplate.name || !customTemplate.content) {
      alert(t("alertNameContent"));
      return;
    }

    const newTemplate: ChapterTemplate = {
      id: `custom-${Date.now()}`,
      name: customTemplate.name,
      description: customTemplate.description || 'Custom template',
      content: customTemplate.content,
      category: 'custom',
    };

    const customTemplates = templates.filter(t => t.category === 'custom');
    const updatedCustom = [...customTemplates, newTemplate];
    saveCustomTemplates(updatedCustom);

    setTemplates(prev => {
      const withoutCustom = prev.filter(t => t.category !== 'custom');
      return [...withoutCustom, ...updatedCustom];
    });

    setCustomTemplate({ name: "", description: "", content: "" });
    setShowCustomForm(false);
    setSelectedTemplateId(newTemplate.id);
  }

  function handleDeleteTemplate(id: string) {
    if (!confirm(t("confirmDeleteTemplate"))) return;

    const customTemplates = templates.filter(t => t.category === 'custom' && t.id !== id);
    saveCustomTemplates(customTemplates);

    setTemplates(prev => {
      const withoutCustom = prev.filter(t => t.category !== 'custom');
      return [...withoutCustom, ...customTemplates];
    });

    if (selectedTemplateId === id) {
      setSelectedTemplateId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label>{t("applyTemplateLabel")}</Label>
          <Select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
            <option value="">{t("selectTemplatePlaceholder")}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </Select>
        </div>
        <Button
          onClick={handleApplyTemplate}
          disabled={!selectedTemplateId}
          className="mt-6"
        >
          {t("applyTemplateButton")}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="mt-6 gap-1.5"
        >
          <Plus className="size-3.5" />
          {t("customButton")}
        </Button>
      </div>

      {showCustomForm && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <Label>{t("templateNameLabel")}</Label>
              <Input
                value={customTemplate.name}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("templateNamePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("descriptionLabel")}</Label>
              <Input
                value={customTemplate.description}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
            <div>
              <Label>{t("templateContentLabel")}</Label>
              <Textarea
                value={customTemplate.content}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t("templateContentPlaceholder")}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                {t("cancelButton")}
              </Button>
              <Button onClick={handleCreateCustomTemplate}>
                {t("saveTemplateButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTemplateId && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {templates.find(t => t.id === selectedTemplateId)?.name}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {templates.find(t => t.id === selectedTemplateId)?.description}
                </p>
                <pre className="mt-3 bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto max-h-40">
                  {templates.find(t => t.id === selectedTemplateId)?.content}
                </pre>
              </div>
              {templates.find(t => t.id === selectedTemplateId)?.category === 'custom' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(selectedTemplateId)}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
