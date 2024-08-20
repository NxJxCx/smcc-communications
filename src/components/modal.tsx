'use client'
import { IconButton, CrossIcon } from "evergreen-ui";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, Fragment, useCallback, useState, useEffect } from "react";

export default function Modal({ path, children }: { path: string, children: ReactNode; }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);

  const onClose = useCallback(() => {
    if (pathname === path) {
      router.back();
    }
  }, [pathname, path, router]);

  useEffect(() => {
    if (pathname === path) {
      setTimeout(() => {
        setOpen(true);
      }, 15);
    } else {
      setOpen(false);
    }
  }, [pathname, path]);
  return (<Fragment>
    {/* @ts-ignore */}
    <div className="fixed left-0 top-0 right-0 bottom-0 z-90 bg-green-100 flex justify-center items-center open:bg-opacity-30 bg-opacity-0 transition-all ease-in-out duration-500 delay-0" open={open}>
      <div className="cursor-pointer absolute w-full h-full" onClick={onClose}></div>
      {/* @ts-ignore */}
      <div className="max-w-6xl max-h-[calc(100vh-50px)] z-100 shadow-lg relative rounded bg-white p-4 open:opacity-100 opacity-20 transition-opacity ease-in-out duration-500 delay-0" open={open}>
        <IconButton icon={CrossIcon} position="absolute" top="5px" right="5px" intent="danger" borderRadius="100%" borderWidth="0" borderColor="red" width="20px" height="20px" appearance="minimal" onClick={onClose} />
        <div className="my-2 px-2">
          { children }
        </div>
      </div>
    </div>
  </Fragment>)
}