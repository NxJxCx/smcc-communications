'use client';;
import { saveTemplate } from '@/actions/superadmin';
import jsxToString from '@/components/JSXToString';
import LoadingComponent from '@/components/loading';
import { DepartmentDocument, DocumentType, ESignatureDocument, UserDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { Editor } from '@tinymce/tinymce-react';
import clsx from 'clsx';
import { CrossIcon, toaster } from 'evergreen-ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';

const tinyMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

export default function AddTemplate({ department, doctype, signatoriesList, onAdd, onCancel }: { department?: DepartmentDocument, doctype: DocumentType, signatoriesList: ESignatureDocument[], onAdd: (templateId: string) => void, onCancel: () => void }) {
  const { status } = useSession({ redirect: false })
  const ppi = 96
  const size = useMemo<{width:number, height:number}>(() => ({
    width: 8.5 * ppi,
    height: 11 * ppi,
  }), []);

  const editorRef = useRef<any>(null);
  const [eSignatures, setESignatures] = useState<string[]>([]);
  const [content, setContent] = useState<any>();

  const onEditContent = useCallback((content: any) => {
    setContent(content);
  }, [])

  const save = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

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

  const onSaveAsTemplate = useCallback(function (api: any, ...props: any) {
    console.log(props)
    const content = editorRef.current?.getContent();
    console.log(content)
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
        // TODO: Save memo template with the specific department selected to the database
        const saveMyTemplate = saveTemplate.bind(null, department?._id || '', doctype, eSignatures)
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
  }, [doctype, onAdd, department?._id, eSignatures])

  const getFullName = useCallback((user?: UserDocument): string => {
    const fn = (user?.prefixName || '') + ' ' + user?.firstName + ' ' + (!!user?.middleName ? user?.middleName[0].toUpperCase() + '. ' : '') + user?.lastName + (user?.suffixName? ', ' + user?.suffixName : '')
    return fn.trim()
  }, [])

  const onAddSignatory = useCallback(function (api: any, ...props: any) {
    const inputOptions: { [x: string]: string } = signatoriesList.reduce((init, signatory) => ({ ...init, [signatory?._id as string]: getFullName(signatory.adminId as UserDocument) }), ({}))
    Swal.fire({
      title: 'Add Signatory',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Select signatory',
      showCancelButton: true,
      confirmButtonText: 'Add',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: false,
    })
    .then(({ isConfirmed, value }) => {
      if (isConfirmed) {
        editorRef.current?.insertContent(
          jsxToString(
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "fit",
                  border: "0px solid black",
                }}
                data-signatory-id={value}
                data-type="signatory"
              >
                <tbody>
                  <tr
                    style={{
                      maxHeight: "20px",
                    }}
                  >
                    <td style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      maxHeight: "20px",
                      borderBottom: "1px solid black",
                      textTransform: 'uppercase',
                      position: "relative"
                    }}
                    data-type="signatory-name">
                      {inputOptions[value]}
                    </td>
                  </tr>
                  <tr>
                    <td style={{
                      textAlign: "center"
                    }}>
                      [Position]
                    </td>
                  </tr>
                </tbody>
              </table>
          )
        );
      }
    })
  }, [getFullName, signatoriesList])

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center mt-4">
      <h2 className="text-2xl font-[600] mb-2">
        Add {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} Template
        <button type="button" onClick={() => onCancel()} className="px-2 py-1 rounded bg-gray-300 text-black ml-4 font-normal text-sm"><CrossIcon display="inline" /> Cancel</button>
      </h2>
      <div className={clsx("flex items-start justify-center", "min-w-[" + size.width + "px]", "max-w-[" + size.width + "px]"  , "min-h-[" + size.height + "px]")}>
        <Editor
          apiKey={tinyMCE_API_KEY}
          onInit={(_evt, editor) => editorRef.current = editor}
          value={content}
          onEditorChange={onEditContent}
          plugins={[
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'image', 'editimage']}
          toolbar={'undo redo | fontfamily fontsize lineheight image table | addAdminSignatory saveAsTemplate | ' +
              'bold italic underline forecolor backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help'}
          init={{
            height: size.height, // 11 inches
            width: size.width, // 8.5 inches
            menubar: false,
            setup: function (editor) {
              editor.ui.registry.addButton("saveAsTemplate", {
                icon: 'save',
                tooltip: 'Save as Template',
                onAction: onSaveAsTemplate,
              });
              editor.ui.registry.addButton("addAdminSignatory", {
                icon: 'add',
                tooltip: 'Add Signatory',
                onAction: onAddSignatory,
              });
            },
            content_style: `body { font-family:Arial,Helvetica,sans-serif; font-size:12pt; line-height: 1.0; margin: 12.2mm; }`,
            image_title: true,
            automatic_uploads: true,
            file_picker_types: 'image',
            file_picker_callback: handleFilePicker,
          }}
        />
      </div>
    </div>
  );
}