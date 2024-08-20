'use client'

import { contactCheckExist, updatePhoneNumber } from "@/actions/signup";
import { useSession } from "@/components/useSession";
import { UserRoles } from "@/lib/models/interfaces";
import { sendSMSVerificationCode, verifySMSVerificationCode } from "@/lib/twilio";
import { Button, Group, Icon, Spinner, TextInputField } from "evergreen-ui";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";


export default function OfficePhoneVerificationComponent({ role }: { role: UserRoles}) {
  const { data: session, status, refresh } = useSession({
    redirect: true,
  });

  const [code, setCode] = useState("");
  const [isPending, setIsPending] = useState<Date|null>(null);
  const [times, setTimes] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [countdownTimer, setCountdownTimer] = useState<string>('00:00');
  const [display, setDisplay] = useState<string|undefined>();
  const [counter, setCounter] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [hasError, setHasError] = useState<string>('');

  const timesUp = useMemo(() => timer > 5 * 60 * 1000, [timer]);

  const haveError = useMemo(() => code.length === 6 && !!hasError ? true : false, [code, hasError]);

  const router = useRouter();

  useEffect(() => {
    setInterval(() => {
      setCounter(prev => prev + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (counter > -1) {
      if (!!isPending) {
        const now = new Date();
        const diff = now.getTime() - isPending.getTime();
        setTimer(diff)
      } else {
        setTimer(6 * 60 * 1000)
      }
    }
    // eslint-disable-next-line
  }, [counter]);

  useEffect(() => {
    let t = "0";
    t += Math.floor((5 * 60 * 1000 - timer) / 1000 / 60).toString();
    t += ":"
    const sec = Math.floor((5 * 60 * 1000 - timer) / 1000) % 60
    t += sec > 9 ? sec.toString() : "0" + sec;
    setCountdownTimer(t)
    if (t === '00:00') {
      setIsPending(null);
    }
  }, [timer])

  const onSendVerification = useCallback(async (ev: any) => {
    ev.preventDefault()
    setCode('')
    if (session?.user?.contactNo) {
      setTimes((prev) => prev + 1);
      setIsPending(new Date());
      try {
        const sendVerify = sendSMSVerificationCode.bind(null, session?.user.contactNo as string, role);
        const result: any = await sendVerify();
        if (result?.error) {
          setHasError(result.error)
        }
      } catch (e: any) {
        console.log(e.message);
        setErrChangeMsg(e.message);
      }
    }
  }, [session, role])

  useEffect(() => {
    if (code.length === 6 && status === 'authenticated') {
      if (/^[0-9]{6}$/.test(code)) {
        const verifyPhone = verifySMSVerificationCode.bind(null, session?.user.contactNo as string, code, role);
        verifyPhone()
          .then((isVerified) => {
            if (isVerified) {
              setHasError('');
              setIsComplete(true);
            } else {
              setHasError('Invalid code');
            }
            setCode('')
          })
          .catch((e) => {
            setHasError(e.message.endsWith('not found') ? 'Code Expired' : 'Invalid Code')
            setCode('')
          })
      } else {
        setHasError('Invalid code');
        return;
      }
    }
    setHasError('');
    // eslint-disable-next-line
  }, [status, code]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (isComplete) {
        setDisplay('c')
      } else {
        if (session?.user?.isPhoneVerified) {
          router.replace('/' + role + '/verify')
        } else {
          setDisplay('a')
        }
      }
    }
    // eslint-disable-next-line
  }, [status, isComplete]);

  const [changing, setChanging] = useState<boolean>(false);
  const [errChangeMsg, setErrChangeMsg] = useState<string|undefined>();
  const [changedNo, setChangedNo] = useState<string>('');
  const [isChangeLoad, setChangeLoad] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setChangedNo(session!.user.contactNo || '');
    }
    // eslint-disable-next-line
  }, [status]);

  const onChangeNow = useCallback(async () => {
    setChangeLoad(true);
    if (/^\+639[0-9]{9}$/.test(changedNo) && !errChangeMsg) {
      if (changedNo === session?.user?.contactNo) {
        setChanging(false);
        setErrChangeMsg(undefined);
        setChangeLoad(false);
        return
      }
      const updateNo = updatePhoneNumber.bind(null, session!.user.email, role, changedNo as string);
      try {
        const hasChanged = await updateNo()
        refresh();
        if (hasChanged) {
          setChanging(false);
          setErrChangeMsg(undefined);
          setTimes(0);
          setIsPending(null);
        }
        setChangeLoad(false);
      } catch (e: any) {
        setErrChangeMsg('Server Error. Try again');
        setChangeLoad(false);
      }
    } else {
      setChangeLoad(false);
    }
  }, [changedNo, errChangeMsg, role, session, refresh])

  const onPhoneInputChange = useCallback(async (ev: any) => {
    ev.preventDefault()
    let phoneNo = ev.target.value;
    if (/^9/.test(phoneNo)) {
      phoneNo = '+63' + phoneNo;
    } else if (/^09/.test(phoneNo)) {
      phoneNo = '+63' + phoneNo.substring(1);
    } else if (/^639/.test(phoneNo)) {
      phoneNo = '+63' + phoneNo.substring(2);
    }
    setChangedNo(phoneNo);
    if (/^\+639[0-9]{9}$/.test(phoneNo)) {
      const checkExist = contactCheckExist.bind(null, phoneNo);
      if (phoneNo !== session?.user?.contactNo) {
        // check if exists
        const exists = await checkExist();
        if (exists) {
          setErrChangeMsg('Phone number is already taken');
          return;
        }
      }
      setErrChangeMsg(undefined);
      return;
    }
    setErrChangeMsg('Invalid phone number');
  }, [session])

  return status !== 'authenticated'
    ? (
      <div className="mt-20 mx-auto max-w-xl p-8 text-center text-gray-800 bg-white shadow-xl lg:max-w-3xl rounded-3xl lg:p-12">
        <Spinner />
      </div>
    ) : (
      <div className="mt-20 mx-auto max-w-xl p-8 text-center text-gray-800 bg-white shadow-xl lg:max-w-3xl rounded-3xl lg:p-12">
        { display === 'a' && (<>
          <h3 className="text-2xl">Thanks for signing up for BAL-OBP!</h3>
          <p>We{"'"}re happy you{"'"}re here. Let{"'"}s get your phone number verified:</p>
          <div className="flex justify-between mt-4 items-start">
            <Icon icon={CellphoneIcon} />
            <div className="grid grid-cols-5 grid-rows-3 flex-grow">
              <div className="col-span-5 text-gray-800 text-lg text-start ml-6 flex">
                { !changing && <div className="pt-3">Phone: {session?.user.contactNo}</div>}
                { changing && <><div className="h-full pt-4 pr-2 text-sm">+63</div><div className="min-h-[90px]"><TextInputField
                    isInvalid={errChangeMsg === undefined ? undefined : !!errChangeMsg}
                    validationMessage={errChangeMsg}
                    onInput={onPhoneInputChange}
                    placeholder="9xxxxxxxxx"
                    defaultValue={session?.user.contactNo.substring(3)}
                    disabled={isChangeLoad}
                  /></div>
                  </>
                }
                <div className="ml-3 h-full pt-2">
                  <Button disabled={!!errChangeMsg || isChangeLoad} onClick={() => !changing ? setChanging(true) : onChangeNow()}>
                    {!changing ? 'Change' : 'Confirm'}
                  </Button>
                </div>
              </div>
              <p className="text-gray-800 mt-2 text-right mr-2 col-span-2">
                Verification Code:
              </p>
              <div className="text-sm mt-2">
                <Button disabled={!timesUp || changing} onClick={onSendVerification} fontSize="10px">
                  {!isPending && times === 0 ? 'Send Code' : (
                    !isPending && times > 0 ? 'Resend' : countdownTimer
                  )}
                </Button>
              </div>
              <div className="text-lg col-span-2 pl-2 items-start flex">
                <Group><TextInputField
                  isInvalid={haveError}
                  validationMessage={!haveError ? undefined : hasError}
                  name="code"
                  value={code}
                  onInput={(ev: any) => setCode(ev.target.value)}
                  placeholder="6 digit code"
                  type="tel"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  disabled={changing || times === 0 || code.length === 6}
                />
                {
                  code.length === 6 && <div className="self-center mb-4 pl-2"><Spinner size={25} /></div>
                }
                </Group>
              </div>
            </div>
          </div>
          </>)
        }
        { display === 'c' && (
          <div className="bg-white p-6 md:mx-auto">
            <div className="text-center">
                <h3 className="md:text-2xl text-base text-gray-900 font-semibold text-center">Phone Number Verified!</h3>
                <p className="text-gray-600 my-2">Thank you for completing your phone number verification.</p>
                <p> You may now proceed to your account. Have a great day!  </p>
                <div className="py-10 text-center">
                  <NextLink href={`/${role}/verify`} className="text-white font-semibold">
                    <Button appearance="primary" intent="success" paddingX="50px" paddingY="20px" fontSize="20px">
                        Proceed
                    </Button>
                  </NextLink>
                </div>
            </div>
          </div>
        )}
      </div>
    );
}

const CellphoneIcon = () => (
  <svg width="100px" height="100px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M14.795 2h-5.59c-1.115 0-1.519.116-1.926.334a2.272 2.272 0 0 0-.945.945C6.116 3.686 6 4.09 6 5.205v13.59c0 1.114.116 1.519.334 1.926.218.407.538.727.945.945.407.218.811.334 1.926.334h5.59c1.114 0 1.519-.116 1.926-.334.407-.218.727-.538.945-.945.218-.407.334-.811.334-1.926V5.205c0-1.115-.116-1.519-.334-1.926a2.272 2.272 0 0 0-.945-.945C16.314 2.116 15.91 2 14.795 2zM8 17.995V6.005h8v11.99H8z" fill="#000000"/></svg>
)