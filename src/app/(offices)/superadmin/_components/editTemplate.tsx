'use client';;
import { updateTemplate } from '@/actions/superadmin';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DocumentType, ESignatureDocument, TemplateDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { toaster } from 'evergreen-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';

export default function EditTemplate({ template, doctype, signatoriesList, onSave }: { template?: TemplateDocument, doctype: DocumentType, signatoriesList: ESignatureDocument[], onSave: (templateId: string) => void }) {
  const { status } = useSession({ redirect: false })
  const ppi = 96
  const size = useMemo<{width:number, height:number}>(() => ({
    width: 8.5 * ppi,
    height: 11 * ppi,
  }), []);

  const editorRef = useRef<any>(null);
  const [content, setContent] = useState<any>(template?.content);

  const handleFilePicker = (cb: any, value: any, meta: any) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.addEventListener('change', (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const id = 'blobid' + (new Date()).getTime();
        const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
        const base64 = (reader.result as any)?.split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        cb(blobInfo.blobUri(), { title: file.name });
      });

      reader.readAsDataURL(file);
    });

    input.click();
  };

  const onSaveAsTemplate = useCallback(function (editor: any, content: string) {
    if (!!template?._id) {
      // TODO: Save memo template with the specific department selected to the database
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
      onSave && onSave(template._id as string)
    }
  }, [onSave, template?._id, doctype])

  useEffect(() => {
    if (!!template?.content) {
      setContent(template?.content);
    }
  }, [template])

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center">
      <h2 className="text-2xl font-[600]">
        {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} Template for {template?.title || "(unknown template)"}
      </h2>
      <OCSTinyMCE editorRef={editorRef} signatoriesList={signatoriesList} contentData={content} onContentData={setContent} onSave={onSaveAsTemplate} />
    </div>
  );
}