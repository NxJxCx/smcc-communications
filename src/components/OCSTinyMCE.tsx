'use client'

import { ESignatureDocument, UserDocument } from "@/lib/modelInterfaces";
import { Editor } from "@tinymce/tinymce-react";
import clsx from "clsx";
import { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import jsxToString from "./JSXToString";


const tinyMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

export default function OCSTinyMCE({ editorRef, signatoriesList, contentData, onAddSignatory, onSave, onContentData }: Readonly<{ editorRef: MutableRefObject<any>, signatoriesList: ESignatureDocument[], contentData?: string, onAddSignatory?: () => void, onSave: (editor: any, content: string) => void, onContentData?: (content: string) => void }>) {
  const ppi = 96
  const size = useMemo<{width:number, height:number}>(() => ({
    width: 8.5 * ppi,
    height: 11 * ppi,
  }), []);
  const [content, setContent] = useState<string>(contentData || '');

  const getFullName = useCallback((user?: UserDocument): string => {
    const fn = (user?.prefixName || '') + ' ' + user?.firstName + ' ' + (!!user?.middleName ? user?.middleName[0].toUpperCase() + '. ' : '') + user?.lastName + (user?.suffixName? ', ' + user?.suffixName : '')
    return fn.trim()
  }, [])
  const onSaveAsTemplate = useCallback(function () {
    const content = editorRef.current?.getContent();
    onSave && onSave(editorRef.current, content)
  }, [editorRef, onSave])

  const onAddSignatories = useCallback(function () {
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
        onAddSignatory && onAddSignatory()
      }
    })
  }, [getFullName, signatoriesList, editorRef, onAddSignatory])

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

  useEffect(() => {
    if (!!contentData) {
      setContent(contentData)
    }
  }, [contentData])

  useEffect(() => {
    onContentData && onContentData(content)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  return (
    <div className={clsx("flex items-start justify-center", "min-w-[" + size.width + "px]", "max-w-[" + size.width + "px]"  , "min-h-[" + size.height + "px]")}>
      <Editor
        apiKey={tinyMCE_API_KEY}
        onInit={(_evt, editor) => editorRef.current = editor}
        value={content}
        onEditorChange={setContent}
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
              tooltip: 'Save',
              onAction: onSaveAsTemplate,
            });
            editor.ui.registry.addButton("addAdminSignatory", {
              icon: 'add',
              tooltip: 'Add Signatory',
              onAction: onAddSignatories,
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
  )
}