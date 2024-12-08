'use client';
import { ESignatureDocument, UserDocument } from "@/lib/modelInterfaces";
import { HighestPosition } from "@/lib/types";
import { useSession } from "@/lib/useSession";
import { Editor } from "@tinymce/tinymce-react";
import clsx from "clsx";
import { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react";
import jsxToString from "./JSXToString";
import { getSignatureIdsFromContent } from "./getSignatureIdsFromContent";


const tinyMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

function getPosition(highestPosition: string|HighestPosition) {
  return highestPosition === HighestPosition.President
    ? "President"
    : highestPosition === HighestPosition.VicePresident
    ? "Vice President"
    : highestPosition
}

export default function OCSTinyMCE({ editorRef, signatoriesList, initialContentData, withPreparedBy = false, withSignatories = true, onAddSignatory, onContent }: Readonly<{ editorRef: MutableRefObject<any>, signatoriesList: ESignatureDocument[], initialContentData?: string, withPreparedBy?: boolean, withSignatories?: boolean, onAddSignatory?: () => void, onContent: (editor: any, content: string) => void }>) {
  const { data: sessionData } = useSession({ redirect: false })
  const ppi = 96
  const size = useMemo<{width:number, height:number}>(() => ({
    width: 8.5 * ppi,
    height: 11 * ppi,
  }), []);
  const [content, setContent] = useState<string>(initialContentData || '');

  const getFullName = useCallback((user?: UserDocument): string => {
    const fn = (user?.prefixName || '') + ' ' + user?.firstName + ' ' + (!!user?.middleName ? user?.middleName[0].toUpperCase() + '. ' : '') + user?.lastName + (user?.suffixName? ', ' + user?.suffixName : '')
    return fn.trim()
  }, [])

  useEffect(() => {
    onContent && onContent(editorRef.current, content)
  }, [content, editorRef, onContent])

  const onAddSignatories = useCallback(function (value: string, name: string, position: string) {
    const selectedNode = editorRef.current?.selection?.getNode();
    const isDiv = selectedNode.nodeName === 'DIV'
    if (!!value) {
      editorRef.current?.insertContent(
        jsxToString(
          isDiv ? (
            <table
              style={{
                borderCollapse: "collapse",
                width: "fit",
                border: "0px solid black",
                display: "inline-block",
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
                    {name}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    textAlign: "center"
                  }}>
                    {position}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "fit",
                  border: "0px solid black",
                  display: "inline-block",
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
                      {name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{
                      textAlign: "center"
                    }}>
                      {position}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )
      );
      onAddSignatory && onAddSignatory()
    }
  }, [onAddSignatory, editorRef])

  const onAddPreparedBy = useCallback(function () {
    const signatory = signatoriesList.find(s => (s.adminId as UserDocument)._id === sessionData?.user?._id)
    const selectedNode = editorRef.current?.selection?.getNode();
    const isDiv = selectedNode.nodeName === 'DIV'

    if (!!signatory) {
      editorRef.current?.insertContent(
        jsxToString(
          isDiv ? (
            <table
              style={{
                borderCollapse: "collapse",
                width: "fit",
                border: "0px solid black",
                display: "inline-block",
              }}
              data-signatory-id={signatory._id}
              data-type="prepared-by"
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
                  data-type="prepared-by-name">
                    {getFullName(signatory.adminId as UserDocument)}
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
          ) : (
            <div>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "fit",
                  border: "0px solid black",
                  display: "inline-block",
                }}
                data-signatory-id={signatory._id}
                data-type="prepared-by"
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
                    data-type="prepared-by-name">
                      {getFullName(signatory.adminId as UserDocument)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{
                      textAlign: "center"
                    }}>
                      {getPosition((signatory.adminId as UserDocument).highestPosition)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )
      );
    }
  }, [editorRef, getFullName, signatoriesList, sessionData?.user?._id])

  const onAddHorizontal = useCallback(function () {
    editorRef.current?.insertContent(
      jsxToString(
        <div>
          <hr
            style={{
              borderBottom: "2px solid black",
              height: "1px",
            }}
          />
        </div>
      )
    );
  }, [editorRef])

  const handleFetchSignatory = useCallback(function (callback: any) {
    const current = editorRef.current;
    const contents = current?.getContent();
    const signatures = getSignatureIdsFromContent(contents);
    const inputOptions: { [x: string]: string } = signatoriesList.reduce((init, signatory) => (signatory.adminId as any)?._id !== sessionData?.user?._id && !signatures.includes(signatory?._id as string) ? ({ ...init, [signatory?._id as string]: getFullName(signatory.adminId as UserDocument) }) : ({...init}), ({}))
    const items = Object.keys(inputOptions).map((item) => ({
      type: 'menuitem',
      text: inputOptions[item],
      onAction: () => onAddSignatories(item, inputOptions[item], getPosition((signatoriesList.find((signatory) => item === signatory._id!.toString())?.adminId as UserDocument)?.highestPosition))
    }));
    callback(items);
  }, [signatoriesList, editorRef, getFullName, onAddSignatories, sessionData])

  const handleFilePicker = useCallback((cb: any, value: any, meta: any) => {
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
  }, [])

  const handleEditorSetup = useCallback((editor: any) => {
    editor.ui.registry.addButton("addHorizontal", {
      icon: 'line',
      tooltip: 'Add horizontal line',
      onAction: onAddHorizontal
    })
    if (withSignatories) {
      editor.ui.registry.addMenuButton('addAdminSignatory', {
        text: 'Add Signatory',
        fetch: handleFetchSignatory
      });
    }
    if (withPreparedBy) {
      editor.ui.registry.addButton("addPreparedBy", {
        icon: 'checkmark',
        tooltip: !withSignatories && withPreparedBy ? 'Add your signatory' : 'Add Prepared By',
        onAction: onAddPreparedBy,
      });
    }
  }, [onAddHorizontal, handleFetchSignatory, onAddPreparedBy, withSignatories, withPreparedBy]);

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
          'image', 'editimage'
        ]}
        toolbar={'undo redo | fontfamily fontsize lineheight image table | ' + (withSignatories ? 'addAdminSignatory ' : '') + (withPreparedBy ? 'addPreparedBy ' : '') + ' | ' +
            'bold italic underline forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | addHorizontal ' +
            'removeformat | help'}
        init={{
          height: size.height, // 11 inches
          width: size.width, // 8.5 inches
          menubar: false,
          setup: handleEditorSetup,
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