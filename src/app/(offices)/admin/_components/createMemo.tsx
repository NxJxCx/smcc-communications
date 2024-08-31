'use client';;
import LoadingComponent from '@/components/loading';
import { useSession } from '@/lib/useSession';
import { Editor } from '@tinymce/tinymce-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const tinyMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

export default function CreateMemoPage() {
  const { status } = useSession({ redirect: false })
  const [ppi, setPPI] = useState<any>(null);

  useEffect(() => {
    // Function to estimate PPI
    const estimatePPI = () => {
      // Create an element with a known physical size
      const testElement = document.createElement('div');
      testElement.style.position = 'absolute';
      testElement.style.width = '1in'; // 1 inch
      testElement.style.height = '1in'; // 1 inch
      testElement.style.left = '-1000px'; // Move off-screen
      document.body.appendChild(testElement);

      // Measure its size in pixels
      const widthInPixels = testElement.offsetWidth;
      const heightInPixels = testElement.offsetHeight;

      // Clean up
      document.body.removeChild(testElement);

      return widthInPixels; // Return width in pixels
    };

    const estimatedPPI = estimatePPI();
    setPPI(estimatedPPI);
  }, []); // Empty dependency array to run only once on mount

  const editorRef = useRef<any>(null);
  const [content, setContent] = useState<any>();
  const onEditContent = useCallback((content: any) => {
    setContent(content);
  }, [])

  const handleEditorInit = (evt: any, editor: any) => {
    // Custom initialization or event handling can be added here if needed
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
      <div className="flex items-start justify-center">
        <Editor
          apiKey={tinyMCE_API_KEY}
          id="createMemoEditor"
          onInit={(_evt, editor) => editorRef.current = editor}
          value={content}
          onEditorChange={onEditContent}
          init={{
            init_instance_callback: handleEditorInit as any,
            height: ppi * 11, // 11 inches
            width: ppi * 8.5, // 8.5 inches
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
              'image', 'editimage',           ],
            toolbar: 'undo redo | blocks fontfamily fontsize lineheight image table | ' +
              'bold italic underline forecolor backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: `body { font-family:Arial,Helvetica,sans-serif; font-size:12pt; }`,
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