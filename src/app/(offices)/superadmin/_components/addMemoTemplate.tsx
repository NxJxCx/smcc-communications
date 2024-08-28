'use client';;
import LoadingComponent from '@/components/loading';
import { useSession } from '@/lib/useSession';
import { Editor } from '@tinymce/tinymce-react';
import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';

const tinyMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

export default function AddMemoTemplate() {
  const { status } = useSession({ redirect: false })
  const ppi = 96
  const size = useMemo<{width:number, height:number}>(() => ({
    width: 8.5 * ppi,
    height: 11 * ppi,
  }), []);

  const editorRef = useRef<any>(null);
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


  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center">
      <div className={clsx("flex items-start justify-center", "min-w-[" + size.width + "px]", "min-h-[" + size.height + "px]")}>
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
          toolbar={'undo redo | blocks fontfamily fontsize lineheight image table | ' +
              'bold italic underline forecolor backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help'}
          init={{
            height: size.height, // 11 inches
            width: size.width, // 8.5 inches
            menubar: false,
            content_style: `body { font-family:Arial,Helvetica,sans-serif; font-size:12pt; line-height: 1.0; }`,
            image_title: true,
            automatic_uploads: true,
            file_picker_types: 'image',
            file_picker_callback: handleFilePicker,
            font_formats: 'Arial=arial, helvetica, sans-serif;Comic Sans MS=comic sans ms, cursive;Courier New=courier new, courier;Georgia=georgia, serif;Helvetica=helvetica, arial, sans-serif;Times New Roman=times new roman, times;Verdana=verdana, geneva',
          }}
        />
      </div>
    </div>
  );
}