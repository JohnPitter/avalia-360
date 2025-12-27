import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { validateTeamMembers } from '@/utils/validation';
import { sanitizeText, sanitizeEmail } from '@/utils/sanitization';
import { downloadExcelTemplate } from '@/utils/excelTemplate';
import { parseExcelFile, type ExcelParseResult } from '@/utils/excelParser';
import type { MemberData } from '@/services/firebase';

/**
 * Componente para Adicionar Membros da Equipe
 * Permite adicionar membros manualmente ou importar de Excel
 */

interface AddMembersFormProps {
  evaluationTitle: string;
  onSubmit: (members: MemberData[]) => void;
  onBack: () => void;
}

interface MemberInput {
  name: string;
  email: string;
}

export function AddMembersForm({
  evaluationTitle,
  onSubmit,
  onBack,
}: AddMembersFormProps) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberInput[]>([
    { name: '', email: '' },
    { name: '', email: '' },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMember = () => {
    setMembers([...members, { name: '', email: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filtra membros vazios
    const filledMembers = members.filter(
      (m) => m.name.trim() || m.email.trim()
    );

    // Sanitiza dados
    const sanitizedMembers = filledMembers.map((m) => ({
      name: sanitizeText(m.name, 100),
      email: sanitizeEmail(m.email),
    }));

    // Valida
    const validation = validateTeamMembers(sanitizedMembers);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onSubmit(sanitizedMembers);
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpar erros anteriores
    setErrors([]);
    setParseResult(null);

    // Fazer parse
    setIsUploading(true);
    try {
      const result = await parseExcelFile(file, {
        maxMembers: 100,
        allowDuplicateEmails: false,
        strictValidation: true,
      });

      setParseResult(result);

      if (!result.success) {
        setErrors(result.errors);
        return;
      }

      if (result.members.length === 0) {
        setErrors([t('manager.addMembers.errors.noValidMembers')]);
        return;
      }

      // Substituir membros existentes pelos importados
      setMembers(
        result.members.map((m) => ({
          name: m.name,
          email: m.email,
        }))
      );

      // Feedback de sucesso
      setErrors([]);
    } catch (error) {
      setErrors([
        `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      ]);
    } finally {
      setIsUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('manager.addMembers.title')}</h3>
            <p className="text-gray-600">
              {t('manager.addMembers.evaluationLabel')} <span className="font-semibold text-blue-600">{evaluationTitle}</span>
            </p>
          </div>

          {/* Excel Import Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-2">{t('manager.addMembers.excelImport.title')}</h4>
                <p className="text-sm text-gray-700 mb-4">
                  {t('manager.addMembers.excelImport.description')}
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Download Template */}
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-200 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('manager.addMembers.excelImport.downloadTemplate')}
                  </button>

                  {/* Upload Excel */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleImportClick}
                    disabled={isUploading}
                    className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all duration-200 ${
                      isUploading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {isUploading ? t('manager.addMembers.excelImport.processing') : t('manager.addMembers.excelImport.importExcel')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm font-medium text-gray-500 bg-white">
                {t('manager.addMembers.divider')}
              </span>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-4">
            {members.map((member, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex gap-4 items-start">
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* Input Fields */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Nome */}
                    <div>
                      <label htmlFor={`name-${index}`} className="block text-sm font-semibold text-gray-900 mb-2">
                        {t('manager.addMembers.nameLabel')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id={`name-${index}`}
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                          placeholder={t('manager.addMembers.namePlaceholder')}
                          required
                          maxLength={100}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor={`email-${index}`} className="block text-sm font-semibold text-gray-900 mb-2">
                        {t('manager.addMembers.emailLabel')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          id={`email-${index}`}
                          value={member.email}
                          onChange={(e) => updateMember(index, 'email', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                          placeholder={t('manager.addMembers.emailPlaceholder')}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {members.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="flex-shrink-0 w-10 h-10 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:scale-110 transition-all flex items-center justify-center"
                      title={t('manager.addMembers.removeTooltip')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            type="button"
            onClick={addMember}
            className="w-full py-4 px-6 bg-white border-2 border-dashed border-blue-300 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('manager.addMembers.addMore')}
          </button>

          {/* Counter Badge */}
          <div className="flex items-center justify-center gap-3">
            <div className={`px-6 py-3 rounded-2xl font-bold text-lg ${
              members.length >= 2
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {members.length} {members.length === 1 ? t('manager.addMembers.counter.member') : t('manager.addMembers.counter.members')}
            </div>
            <div className="text-sm text-gray-600">
              {members.length >= 2 ? t('manager.addMembers.counter.minReached') : t('manager.addMembers.counter.minRequired')}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">{t('manager.addMembers.errors.title')}</p>
                  <ul className="space-y-1 text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Excel Parse Result - Warnings */}
          {parseResult && parseResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-2">{t('manager.addMembers.warnings.title')}</p>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {parseResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Excel Parse Result - Success Summary */}
          {parseResult && parseResult.success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    {t('manager.addMembers.success.imported', { count: parseResult.validRows })}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {t('manager.addMembers.success.summary', { total: parseResult.totalRows, valid: parseResult.validRows })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-3">{t('manager.addMembers.howItWorks.title')}</h4>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: t('manager.addMembers.howItWorks.step1') }} />
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: t('manager.addMembers.howItWorks.step2') }} />
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: t('manager.addMembers.howItWorks.step3') }} />
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: t('manager.addMembers.howItWorks.step4') }} />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                {t('manager.addMembers.back')}
              </span>
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                {t('manager.addMembers.submit')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
