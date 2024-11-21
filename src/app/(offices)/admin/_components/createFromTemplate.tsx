'use client'
import { saveMemorandumLetter, saveMemorandumLetterToIndividual } from '@/actions/admin';
import { getSignatureIdsFromContent } from '@/components/getSignatureIdsFromContent';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DocumentType, ESignatureDocument, TemplateDocument, UserDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { CrossIcon, toaster } from 'evergreen-ui';
import { useCallback, useRef } from 'react';
import Swal from 'sweetalert2';

export default function CreateFromTemplate({ departmentId, individual, template, doctype, signatoriesList, isHighestPosition, onSave, onCancel }: { departmentId?: string, individual?: UserDocument, template?: TemplateDocument, doctype: DocumentType, isHighestPosition?: boolean, signatoriesList: ESignatureDocument[], onSave: (memoradumId: string) => void, onCancel: () => void }) {
  const { status } = useSession({ redirect: false })
  // const ppi = 96
  // const size = useMemo<{width:number, height:number}>(() => ({
  //   width: 8.5 * ppi,
  //   height: 11 * ppi,
  // }), []);

  const editorRef = useRef<any>(null);

  const onSaveAsTemplate = useCallback(function (editor: any, content: string) {
    if (!!individual) {
      Swal.fire({
        icon: 'question',
        title: 'Send ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' to ' + individual?.firstName + " " + individual?.lastName + "?",
        text: 'This ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' will be sent with your approved signature. Are you sure you want to send?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Send it',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: false,
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          Swal.fire({
            title: 'Enter ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title:',
            input: 'text',
            inputValue: template?.title || '',
            showCancelButton: true,
            confirmButtonText: 'Confirm and Send',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: false,
          }).then(async ({ isConfirmed, value }) => {
            if (isConfirmed) {
              if (!value) {
                toaster.danger('Please enter a ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title')
                return;
              }
              const saveMyTemplate = saveMemorandumLetterToIndividual.bind(null, individual._id || '', doctype)
              const formData = new FormData()
              formData.append('title', value)
              formData.append('content', content)
              const { success, memorandumId, letterId, error } = await saveMyTemplate(formData)
              if (error) {
                toaster.danger(error)
              } else if (success) {
                toaster.success(success)
                onSave && doctype === DocumentType.Memo && onSave(memorandumId as string)
                onSave && doctype === DocumentType.Letter && onSave(letterId as string)
              }
            }
          })
        }
      })
    } else if (!!departmentId) {
      Swal.fire({
        icon: 'question',
        title: 'Save and Submit ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + '?',
        text: 'Once saved, this ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' will be submitted for approval. Are you sure you want to save?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: false,
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          Swal.fire({
            title: 'Enter ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title:',
            input: 'text',
            inputValue: template?.title || '',
            showCancelButton: true,
            confirmButtonText: 'Submit and Send',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: false,
          }).then(async ({ isConfirmed, value }) => {
            if (isConfirmed) {
              if (!value) {
                toaster.danger('Please enter a ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title')
                return;
              }
              const eSignatures = getSignatureIdsFromContent(content);
              const saveMyTemplate = saveMemorandumLetter.bind(null, departmentId || '', doctype, eSignatures)
              const formData = new FormData()
              formData.append('title', value)
              formData.append('content', content)
              const { success, memorandumId, letterId, error } = await saveMyTemplate(formData)
              if (error) {
                toaster.danger(error)
              } else if (success) {
                toaster.success(success)
                onSave && doctype === DocumentType.Memo && onSave(memorandumId as string)
                onSave && doctype === DocumentType.Letter && onSave(letterId as string)
              }
            }
          })
        }
      })
    }
  }, [onSave, departmentId, doctype, template?.title, individual])

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center">
      <h2 className="text-2xl font-[600]">
        {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} - {template?.title || "(new)"}
        <button type="button" onClick={() => onCancel()} className="px-2 py-1 rounded bg-gray-300 text-black ml-4 font-normal text-sm"><CrossIcon display="inline" /> Cancel</button>
      </h2>
      <OCSTinyMCE editorRef={editorRef} signatoriesList={signatoriesList} initialContentData={template?.content} onSave={onSaveAsTemplate} withPreparedBy withSignatories={!individual?._id} />
    </div>
  );
}