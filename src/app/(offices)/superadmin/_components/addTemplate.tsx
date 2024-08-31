'use client';;
import { saveTemplate } from '@/actions/superadmin';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DepartmentDocument, DocumentType, ESignatureDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { CrossIcon, toaster } from 'evergreen-ui';
import { useCallback, useRef } from 'react';
import Swal from 'sweetalert2';

export default function AddTemplate({ department, doctype, signatoriesList, onAdd, onCancel }: { department?: DepartmentDocument, doctype: DocumentType, signatoriesList: ESignatureDocument[], onAdd: (templateId: string) => void, onCancel: () => void }) {
  const { status } = useSession({ redirect: false })

  const editorRef = useRef<any>(null);

  const onSaveAsTemplate = useCallback(function (editor: any, content: string) {
    Swal.fire({
      title: 'Enter ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' template title:',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: false,
    }).then(async ({ isConfirmed, value }) => {
      if (isConfirmed) {
        if (!value) {
          toaster.danger('Please enter a template title')
          return;
        }
        const saveMyTemplate = saveTemplate.bind(null, department?._id || '', doctype)
        const formData = new FormData()
        formData.append('title', value)
        formData.append('content', content)
        const { success, templateId, error } = await saveMyTemplate(formData)
        if (error) {
          toaster.danger(error)
        } else if (success) {
          toaster.success(success)
          onAdd && onAdd(templateId as string)
        }
      }
    })
  }, [doctype, onAdd, department?._id])

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center mt-4">
      <h2 className="text-2xl font-[600] mb-2">
        Add {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} Template
        <button type="button" onClick={() => onCancel()} className="px-2 py-1 rounded bg-gray-300 text-black ml-4 font-normal text-sm"><CrossIcon display="inline" /> Cancel</button>
      </h2>
      <OCSTinyMCE editorRef={editorRef} signatoriesList={signatoriesList} onSave={onSaveAsTemplate} />
    </div>
  );
}