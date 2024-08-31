'use client';;
import { updateTemplate } from '@/actions/superadmin';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DocumentType, ESignatureDocument, TemplateDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { toaster } from 'evergreen-ui';
import { useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';

export default function EditTemplate({ template, doctype, signatoriesList, onSave }: { template?: TemplateDocument, doctype: DocumentType, signatoriesList: ESignatureDocument[], onSave: (templateId: string) => void }) {
  const { status } = useSession({ redirect: false })
  const ppi = 96
  const size = useMemo<{width:number, height:number}>(() => ({
    width: 8.5 * ppi,
    height: 11 * ppi,
  }), []);

  const editorRef = useRef<any>(null);

  const onSaveAsTemplate = useCallback(function (editor: any, content: string) {
    if (!!template?._id) {
      Swal.fire({
        icon: 'question',
        title: 'Save changes to existing template?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: false,
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          const saveMyTemplate = updateTemplate.bind(null, template?._id || '', doctype)
          const formData = new FormData()
          formData.append('content', content)
          const { success, error } = await saveMyTemplate(formData)
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            onSave && onSave(template._id as string)
          }
        }
      })
    }
  }, [onSave, template?._id, doctype])

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center">
      <h2 className="text-2xl font-[600]">
        {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} Template for {template?.title || "(unknown template)"}
      </h2>
      <OCSTinyMCE editorRef={editorRef} signatoriesList={signatoriesList} initialContentData={template?.content} onSave={onSaveAsTemplate} />
    </div>
  );
}