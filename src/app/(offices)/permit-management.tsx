'use client';;
import { applicationStepStatusAction, setAssessmentAmountAction, updatePermitApplication } from '@/actions/permit';
import { FormButton } from '@/components/forms/button';
import LoadingComponent from '@/components/loading';
import { StatusType, TypeOfPermit, UserRoles, type ApplicationDocument, type UserDocument } from '@/lib/models/interfaces';
import { Permits, ResponseFormState } from '@/lib/types';
import clsx from 'clsx';
import {
  AutomaticUpdatesIcon,
  Button,
  ConfirmIcon,
  CrossIcon,
  Dialog,
  DocumentIcon,
  DownloadIcon,
  EditIcon,
  EyeOpenIcon,
  FileCard,
  FileRejection,
  FileUploader,
  FilterListIcon,
  IconButton,
  MimeType,
  Pagination,
  Pane,
  Paragraph,
  Position,
  PrintIcon,
  RefreshIcon,
  SelectMenu,
  StatusIndicator,
  Tab,
  Table,
  Tablist,
  Textarea,
  TextInput,
  toaster,
  Tooltip,
} from 'evergreen-ui';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import BuildingPermitForm from './obo/permit/_form/building-permit-form';
import ElectricalPermitForm from './obo/permit/_form/electrical-permit-form';
import SanitaryPermitForm from './obo/permit/_form/sanitary-permit-form';
import BuildingPermitPrintDocument from './obo/permit/_print/building-permit';
import ElectricalPermitPrintDocument from './obo/permit/_print/electrical-permit';
import SanitaryPermitPrintDocument from './obo/permit/_print/sanitary-permit';

interface ColumnsProp {
  label: string;
  value: string;
}

type ColumnsType = ColumnsProp[]

export default function PermitManagementTable({
  role,
  permitUrl = '',
  searchParam,
  step = 0,
  isDisabled = false,
  receivingOnly = false,
  withMayorsPermit = false,
  displayMayorsPermit = false,
  isRejects = false,
  editable = false,
  viewable = false,
  printable = false,
  isCompleted = false,
  isViewPaymentOnly = false,
  isPaid = false,
  refreshNotification = () => {},
  onSelected = () => {},
  onLoading = () => {},
} : Readonly<{
  role: UserRoles;
  permitUrl: string;
  searchParam?: string;
  step?: number;
  isDisabled?: boolean;
  receivingOnly?: boolean;
  withMayorsPermit?: boolean;
  displayMayorsPermit?: boolean;
  isViewPaymentOnly?: boolean;
  isPaid?: boolean;
  isRejects?: boolean;
  editable?: boolean;
  viewable?: boolean;
  printable?: boolean;
  isCompleted?: boolean;
  refreshNotification?: () => void;
  onSelected?: (appl?: ApplicationDocument) => void;
  onLoading?: (isLoading: boolean) => void;
}>) {
  const columnsFinal: ColumnsType = useMemo(() => {
    const cols = [
      { label: 'Application No.', value: 'applicationNo' },
    ];
    if (isViewPaymentOnly) {
      cols.push({ label: 'Payment for MPDC', value: 'paymentMPDC' });
      cols.push({ label: 'Payment for OBO', value: 'paymentOBO' });
      cols.push({ label: 'Total Payment', value: 'totalPayment' });
    }
    [
      { label: 'Location of Construction', value: 'locationOfConstruction' },
      { label: 'TCT No.', value: 'tctNo' },
      { label: 'Current Tax Dec. No.', value: 'taxDecNo' },
      { label: 'Full Name', value:'fullName' },
      { label: 'Email Address', value: 'email' },
      { label: 'Phone No.', value: 'contactNo' },
      { label: 'TIN', value: 'tin' },
      { label: 'Authorized Representative', value: 'authorizedRepresentative' },
      { label: 'Date of Application', value: 'dateOfApplication' },
    ].forEach((col) => cols.push(col));
    if (displayMayorsPermit) {
      cols.push({ label: `Mayor's Permit`, value: 'mayorsPermitImage' });
    }
    if (isCompleted) {
      cols.push({ label: 'Completed on', value: 'completedOn' });
    }
    if (isRejects) {
      cols.push({ label: 'Reason', value: 'rejectReason' });
    }
    return cols;
  }, [displayMayorsPermit, isCompleted, isRejects, isViewPaymentOnly])

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortcontroller] = useState<AbortController>(new AbortController());
  const [datalist, setDatalist] = useState<ApplicationDocument[]>([]);
  const [search, setSearch] = useState<string>(searchParam || '');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDocument|undefined>(undefined);
  const [page, setPage] = useState<number>(0);
  const displayFullName = useCallback((appl: UserDocument) => appl?.firstName + ' ' + (!!appl?.middleName ? appl.middleName[0].toUpperCase() + '. ' : '') + appl?.lastName, [])
  const displayLocation = useCallback((location: any) => (location?.lotNo ? 'Lot ' + location?.lotNo + ' ' : '') + (location?.blkNo ? ' Blk ' + location?.blkNo + ' ' : '') +
    location?.street + ', ' + location?.barangay + ', ' + location?.cityMunicipality
  , [])
  const displayDateName = useCallback((date: string) => !!date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined, [])
  const isBetweenDates = useCallback((start: string, end: string, date: string, year?: string) => {
    const monthNames = ["january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const endOfMonths = [31, new Date(!!year ? Number.parseInt(year) : (new Date()).getFullYear(), 1, 29).getMonth() === 1 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let s: Date, e: Date;
    console.log("WHAT", start, end, date, year)
    if (monthNames.includes(start)) {
      s = new Date(!!year ? Number.parseInt(year) : (new Date()).getFullYear(), monthNames.indexOf(start), 1);
    } else {
      s = new Date(start);
    }
    if (monthNames.includes(end)) {
      e = new Date(!!year ? Number.parseInt(year) : (new Date()).getFullYear(), monthNames.indexOf(end), endOfMonths[monthNames.indexOf(end)]);
    } else {
      e = new Date(end);
    }
    const d = new Date(date);
    return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
  }, [])
  const filterID = useCallback((id?: string) => !!id ? id!.substring(0, 2) + '****' + id!.substring(id!.length > 3 ? id!.length - 3 : id!.length -1) : 'N/A', [])
  const [imageUrl, setImageUrl] = useState('')
  const [mayorsPermitFile, setMayorsPermitFile] = useState<File[]>([])
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([])
  const onMayorsPermitFileChange = useCallback((files: File[]) => {
    if (!!imageUrl) {
      window.URL.revokeObjectURL(imageUrl)
      setImageUrl('')
    }
    setMayorsPermitFile([files[0]]);
    const reader = new FileReader()
    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = (e) => {
      const binaryStr = reader.result
      const fileBlob = new Blob([new Uint8Array(binaryStr as ArrayBuffer)], {
        type: files[0].type
      })
      const fileurl = window.URL.createObjectURL(fileBlob)
      setImageUrl(fileurl)
    }
    reader.readAsArrayBuffer(files[0])
  }, [imageUrl])
  const onMayorsPermitFileRejected = useCallback((fileRejections: FileRejection[]) => setFileRejections([fileRejections[0]]), [])
  const onMayorsPermitFileRemove = useCallback(() => {
    setMayorsPermitFile([])
    setFileRejections([])
  }, [])
  const [showImagePreviewOverlay, setShowImagePreviewOverlay] = useState<boolean>(false)
  const onImagePreviewClose = useCallback(() => {
    setShowImagePreviewOverlay(false)
    if (displayMayorsPermit && !!imageUrl) {
      window.URL.revokeObjectURL(imageUrl)
      setImageUrl('')
    }
  }, [displayMayorsPermit, imageUrl])
  const toArrayBuffer = useCallback((buffer: Buffer) => {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }
    return arrayBuffer;
  }, [])
  const setAndShowMayorsPermit = useCallback((appl: ApplicationDocument) => {
    if (!!appl?.mayorsPermit) {
      setShowImagePreviewOverlay(true)
      const url = new URL('/' + role + '/api/permit/' + appl.applicationNo, window.location.origin);
      url.searchParams.append('get', 'mayors-permit')
      fetch(url)
        .then(response => response.json())
        .then(({ data }) => {
          const arrayBuffer = toArrayBuffer(Buffer.from(data.file))
          const fileBlob = new Blob([new Uint8Array(arrayBuffer)], {
            type: data.mimeType
          })
          const imUrl =  window.URL.createObjectURL(fileBlob)
          setImageUrl(imUrl)
        })
        .catch(error => console.error('Error:', error))
    }
  }, [role, toArrayBuffer])
  const filteredDataList = useMemo(() => {
    return datalist.filter((appl) =>
      appl?.applicationNo?.toLowerCase().includes(search.toLowerCase()) ||
      displayLocation(appl?.locationOfConstruction)?.toLowerCase().includes(search.toLowerCase()) ||
      appl?.locationOfConstruction?.tctNo?.toLowerCase().includes(search.toLowerCase()) ||
      appl?.locationOfConstruction?.taxDecNo?.toLowerCase().includes(search.toLowerCase()) ||
      displayFullName(appl.user as UserDocument)?.toLowerCase().includes(search.toLowerCase()) ||
      (appl?.user as UserDocument)?.email?.toLowerCase().includes(search.toLowerCase()) ||
      (appl?.user as UserDocument)?.contactNo?.toLowerCase().includes(search.toLowerCase()) ||
      appl?.representative?.lotOwnerAuthorizedRepresentative?.toLowerCase().includes(search.toLowerCase()) ||
      (appl?.createdAt as string)?.substring(0, 10)?.toLowerCase().includes(search.toLowerCase()) ||
      (appl?.createdAt as string)?.substring(0, 4)?.toLowerCase().includes(search.toLowerCase()) ||
      `${(appl?.createdAt as string)?.substring(5, 7)?.toLowerCase()}/${(appl?.createdAt as string)?.substring(8, 10)?.toLowerCase()}/${(appl?.createdAt as string)?.substring(0, 4)?.toLowerCase()}`.includes(search.toLowerCase()) ||
      displayDateName(appl?.createdAt as string)?.toLowerCase()?.includes(search.toLowerCase()) ||
      (
        /^[0-1]{1}\d{1}\/[0-3]{1}\d{1}\/2\d{3}\-[0-1]{1}\d{1}\/[0-3]{1}\d{1}\/2\d{3}/.test(search.toLowerCase())
        && isBetweenDates(search.toLowerCase().substring(0, 10), search.toLowerCase().substring(11, 23), appl?.createdAt as string)
      ) ||
      (
        /^\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\-\b(?:january|february|march|april|may|june|july|august|september|october|november|december)/.test(search.toLowerCase())
        && isBetweenDates(search.toLowerCase().split('-')[0], search.toLowerCase().split('-')[1], appl?.createdAt as string)
      ) ||
      (
        /^\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\-\b(?:january|february|march|april|may|june|july|august|september|october|november|december) 2\d{3}/.test(search.toLowerCase())
        && isBetweenDates(search.toLowerCase().split('-')[0], search.toLowerCase().split('-')[1].split(' ')[0], appl?.createdAt as string, search.toLowerCase().split('-')[1].split(' ')[1])
      ) ||
      appl?.amountMPDC?.toString().includes(search.toLowerCase()) ||
      appl?.amountOBO?.toString().includes(search.toLowerCase()) ||
      (appl?.amountMPDC && appl?.amountOBO && (Number.parseFloat(appl.amountMPDC.toString()) + Number.parseFloat(appl.amountOBO.toString())).toString().includes(search.toLowerCase()))
    );
  }, [search, datalist, displayLocation, displayFullName, displayDateName, isBetweenDates]);
  const totalPages = useMemo(() => Math.ceil(filteredDataList.length / 10), [filteredDataList]);
  const paginatedDataList = useMemo<any[]>(() => {
    setSelectedApplication(undefined);
    return filteredDataList.slice(page * 10, (page + 1) * 10).map((appl: ApplicationDocument) => ({
      ...appl,
      fullName: displayFullName(appl?.user as UserDocument),
      locationOfConstruction: displayLocation(appl?.locationOfConstruction),
      email: (appl?.user as UserDocument).email,
      contactNo: (appl?.user as UserDocument).contactNo,
      tin: filterID((appl?.user as UserDocument).tin),
      tctNo: filterID(appl?.locationOfConstruction.tctNo),
      taxDecNo: filterID(appl?.locationOfConstruction.taxDecNo),
      authorizedRepresentative: !!appl?.representative?.lotOwnerAuthorizedRepresentative ? appl.representative.lotOwnerAuthorizedRepresentative : <span className="text-red-500 uppercase">N/A</span>,
      dateOfApplication: displayDateName(appl?.createdAt as string),
      mayorsPermitImage: <IconButton icon={DocumentIcon} onClick={() => setAndShowMayorsPermit(appl)} />,
      completedOn: displayDateName(!!appl?.status ? (([...appl!.status].pop())?.createdAt as string) : ''),
      rejectReason: [...appl?.status].pop()?.rejectReason,
      paymentMPDC: <span className={clsx(isPaid ? "text-green-500": "text-red-500")}>{(Number.parseFloat(appl?.amountMPDC?.toString() || '0')).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span>,
      paymentOBO: <span className={clsx(isPaid ? "text-green-500": "text-red-500")}>{(Number.parseFloat(appl?.amountOBO?.toString() || '0')).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span>,
      totalPayment: <span className={clsx(isPaid ? "text-green-500": "text-red-500")}>{(Number.parseFloat(appl?.amountMPDC?.toString() || '0') + Number.parseFloat(appl?.amountOBO?.toString() || '0')).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span>,
    }));
  }, [filteredDataList, page, displayLocation, displayFullName, filterID, displayDateName, setAndShowMayorsPermit, isPaid]);

  useEffect(() => {
    if (onLoading) {
      onLoading(isLoading);
    }
    // eslint-disable-next-line
  }, [isLoading]);

  const onAbort = useCallback((_: Event) => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line
  }, []);

  const [selectedColumnsState, setSelectedColumns] = useState<string[]>(columnsFinal.map((col: any) => col.value));
  const selectedColumns = useMemo(() => selectedColumnsState.length === 0
    ? columnsFinal
    : columnsFinal.filter((item: ColumnsProp) => selectedColumnsState.includes(item.value))
  , [selectedColumnsState, columnsFinal]);

  const onSelectedApplication = useCallback((index?: number) => {
    if (index === undefined) {
      setSelectedApplication(undefined);
      onSelected(undefined);
    } else {
      const ftl = filteredDataList.slice(page * 10, (page + 1) * 10);
      const appl = ftl[index];
      setSelectedApplication(appl);
      onSelected(appl);
    }
  }, [onSelected, filteredDataList, page]);

  const refreshList = useCallback(() => {
    return new Promise(resolve => {
    onSelectedApplication(undefined);
    const url = new URL(permitUrl, window.location.origin);
    abortController.abort()
    const newAbortController = new AbortController()
    newAbortController.signal.onabort = onAbort;
    setAbortcontroller(newAbortController);
    setIsLoading(true);
    fetch(url, { signal: newAbortController.signal })
      .then((response: Response) => response.json())
      .then(({ data }: { data: ApplicationDocument[] }) => {
        setDatalist(data || []);
      })
      .catch(console.log)
      .finally(() => {
        setIsLoading(false);
        resolve(undefined);
      })
    })
  }, [abortController, onAbort, onSelectedApplication, permitUrl]);

  const [isShownApprove, setShowApprove] = useState<boolean>(false)
  const [isShownReject, setShowReject] = useState<boolean>(false)
  const [isShownCancel, setShowCancel] = useState<boolean>(false)
  const [amountValue, setAmountValue] = useState<number>(0);

  const onApprove = useCallback(() => {
    if (!!selectedApplication) {
      setShowApprove(true);
    }
  }, [selectedApplication])

  const onReject = useCallback(() => {
    if (!!selectedApplication) {
      setShowReject(true);
    }
  }, [selectedApplication])

  const onCancel = useCallback(() => {
    if (!!selectedApplication) {
      setShowCancel(true);
    }
  }, [selectedApplication])

  const [pendingLoading, setPendingLoading] = useState<boolean>(false)
  const onApproveApplication = useCallback(async () => {
    setPendingLoading(true);
    if (!!selectedApplication) {
      if (!isRejects && !receivingOnly && !isDisabled && (step === 3 || step === 4 || step === 7) && amountValue > 0) {
        try {
          const setAmountAction = setAssessmentAmountAction.bind(null, role, selectedApplication.applicationNo, step, amountValue)
          const response = await setAmountAction()
          if (!response?.success) {
            toaster.danger("Failed to approve: " + response?.message)
            return
          }
        } catch (e: any) {
          console.log(e)
          toaster.danger("Error: " + e.message)
        }
      }
      try {
        let formData: FormData|undefined;
        if (withMayorsPermit && mayorsPermitFile.length > 0) {
          formData = new FormData();
          formData.append("mayors-permit", mayorsPermitFile[0], mayorsPermitFile[0].name)
        }
        const nextStepAction = applicationStepStatusAction.bind(null, role, selectedApplication.applicationNo, step === 10 ? StatusType.Completed : (isRejects || (receivingOnly && step !== 8 && step !== 9)) ? StatusType.Pending : StatusType.Approved, formData)
        const response = await nextStepAction()
        if (!!response?.success) {
          toaster.success("Approved successfully")
          refreshList()
          refreshNotification()
        } else {
          toaster.danger("Failed to approve: " + response?.message)
        }
      } catch (e: any) {
        console.log(e)
        toaster.danger("Error: " + e.message)
      }
    } else {
      toaster.warning("No selected")
    }
    setPendingLoading(false);
  }, [selectedApplication, role, refreshList, step, refreshNotification, amountValue, receivingOnly, isDisabled, isRejects, withMayorsPermit, mayorsPermitFile])

  const [rejectReason, setRejectReason] = useState<string>("")

  const onRejectApplication = useCallback(async () => {
    setPendingLoading(true);
    if (!!selectedApplication) {
      try {
        let formData: FormData|undefined;
        if ((step === 4 || step === 7) && !!rejectReason) {
          formData = new FormData();
          formData.append("reject-reason", rejectReason)
        }
        const nextStepAction = applicationStepStatusAction.bind(null, role, selectedApplication.applicationNo, StatusType.Rejected, formData)
        const response = await nextStepAction()
        if (!!response?.success) {
          toaster.success("Rejected successfully")
          refreshList()
          refreshNotification()
        } else {
          toaster.danger("Failed to approve: " + response?.message)
        }
      } catch (e: any) {
        console.log(e)
        toaster.danger("Error: " + e.message)
      }
    } else {
      toaster.warning("No selected")
    }
    setPendingLoading(false);
  }, [selectedApplication, role, refreshList, refreshNotification, step, rejectReason])

  const onDeclineApplication = useCallback(async () => {
    setPendingLoading(true);
    if (!!selectedApplication) {
      try {
        const nextStepAction = applicationStepStatusAction.bind(null, role, selectedApplication.applicationNo, StatusType.Cancelled)
        const response = await nextStepAction()
        if (!!response?.success) {
          toaster.success("Rejected successfully")
          refreshList()
          refreshNotification()
        } else {
          toaster.danger("Failed to approve: " + response?.message)
        }
      } catch (e: any) {
        console.log(e)
        toaster.danger("Error: " + e.message)
      }
    } else {
      toaster.warning("No selected")
    }
    setPendingLoading(false);
  }, [selectedApplication, role, refreshList, refreshNotification])

  const [isShownPermitForm, setShowPermitForm] = useState<boolean>(false)
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const tabs = useMemo(() => selectedApplication?.typeOfPermit === TypeOfPermit.BuildingPermit
    ? [
        Permits.BuildingPermit,
        !!selectedApplication.electricalPermit ? Permits.ElectricalPermit : undefined,
        !!selectedApplication.sanitaryPermit ? Permits.SanitaryPermit : undefined
      ].filter(v => !!v)
    : selectedApplication?.typeOfPermit === TypeOfPermit.ElectricalPermitOnly
    ? [Permits.ElectricalPermit]
    : []
  , [selectedApplication])
  const maxTabs = useMemo(() => tabs.length, [tabs])
  const selectedTabPermitFormIndex = useMemo(() => maxTabs <= selectedIndex ? maxTabs - 1 : selectedIndex, [maxTabs, selectedIndex])
  const updatePermitApplicationAction = useMemo(() => updatePermitApplication.bind(null, selectedApplication?.applicationNo), [selectedApplication])
  const [stateUpdate, actionUpdate] = useFormState<ResponseFormState>(updatePermitApplicationAction as any, undefined)
  const { pending } = useFormStatus()
  const [showManualAlert, setShowManualAlert] = useState<boolean>(false)
  const [manualError, setManualError] = useState<string[]|React.ReactNode[]>([])

  const [alertTimeout, setAlertTimeout] = useState<any>()

  const onPermitApplicationEditInvalid = useCallback((e: any) => {
    const target = e.target as any;
    if (target.name.startsWith("buildingPermitPermit")) {
      setSelectedIndex(tabs.indexOf(Permits.BuildingPermit));
      e.preventDefault();
      e.stopPropagation();
      target.focus();
    } else if (target.name.startsWith("electricalPermit")) {
      setSelectedIndex(tabs.indexOf(Permits.ElectricalPermit));
      e.preventDefault();
      e.stopPropagation();
      target.focus();
    } else if (target.name.startsWith("sanitaryPermit")) {
      setSelectedIndex(tabs.indexOf(Permits.SanitaryPermit));
      e.preventDefault();
      e.stopPropagation();
      target.focus();
    }
    setManualError(prev => !prev.includes((target as HTMLInputElement).parentElement?.textContent as any) ? [...prev, (target as HTMLInputElement).parentElement?.textContent] : prev)
    if (alertTimeout) {
      clearTimeout(alertTimeout);
    }
    setAlertTimeout(setTimeout(() => {
      setShowManualAlert(true)
    }, 30))
  }, [tabs, alertTimeout])

  useEffect(() => {
    if (!pending && !!stateUpdate?.success) {
      toaster.success("Permit Application Form Updated Successfully!")
    } else if (!pending && !!stateUpdate?.errors) {
      setShowAlert(true)
    }
    // eslint-disable-next-line
  }, [pending, stateUpdate])

  useEffect(() => {
    if (showAlert && !!stateUpdate?.errors) {
      toaster.danger(
        stateUpdate!.message,
        {
          description: Object.keys(stateUpdate!.errors).map((key: string, index: number) => (stateUpdate!.errors as any)[key].map((msg: string, i: number) => (<>
            <StatusIndicator key={(index + 1) * (i + 1)} color="danger">
              <Paragraph color="danger">{msg}</Paragraph>
            </StatusIndicator>
            <br />
          </>))),
          id: 'stateErrorForm',
          duration: 60
        }
      )
      setShowAlert(false)
    }
    // eslint-disable-next-line
  }, [showAlert])

  useEffect(() => {
    if (showManualAlert && manualError.length > 0) {
      const manualErrors = [...manualError];
      toaster.danger(
        "Fill in the required fields (*)",
        {
          description: manualErrors.map((msg: any, index: number) => (<>
            <StatusIndicator key={"err_" + index} color="danger">
              <Paragraph color="danger">{msg}</Paragraph>
            </StatusIndicator>
            <br />
          </>)),
          duration: 60,
          id: 'manualError',
        }
      )
      setShowManualAlert(false)
      setManualError([])
    }
    // eslint-disable-next-line
  }, [showManualAlert])

  const onEditClose = useCallback(() => {
    setShowPermitForm(false);
    setShowPermitView(false);
    setSelectedIndex(0);
    setManualError([]);
    setShowAlert(false);
    setShowManualAlert(false);
    refreshList()
  }, [refreshList])

  const [isShownPermitView, setShowPermitView] = useState<boolean>(false)


  return (
    <div className="w-full max-w-full overflow-x-auto">
      <Table.Row>
        <Table.Cell>
          <SelectMenu
            isMultiSelect
            title="Filter columns"
            selected={selectedColumnsState}
            options={columnsFinal}
            onSelect={(item: any) => {
              const selected = [...selectedColumnsState, item.value]
              const selectedItems = selected
              setSelectedColumns(selectedItems)
            }}
            onDeselect={(item: any) => {
              const deselectedItemIndex = selectedColumnsState.indexOf(item.value)
              const selectedItems = selectedColumnsState.filter((_item, i) => i !== deselectedItemIndex)
              setSelectedColumns(selectedItems)
            }}
          >
            <Tooltip position={Position.TOP} appearance="card" content="Filter Columns">
              <IconButton intent={selectedColumns.length !== columnsFinal.length ? "success" : "none"} appearance={selectedColumns.length !== columnsFinal.length ? "primary" : "default"} icon={FilterListIcon} />
            </Tooltip>
          </SelectMenu>
          <Table.SearchHeaderCell placeholder='Search...' value={search} onInput={(ev: any) => setSearch(ev.target.value)} />
        </Table.Cell>
        <Table.Cell>
          <div className="flex items-center justify-between w-full">
            <div className="flex border-r flex-grow justify-end items-center space-x-2 mr-3 pr-3">
              {!!selectedApplication && !isDisabled && (<>
                {viewable && <Tooltip position={Position.TOP} appearance="card" content={"View Permit Application Forms"}>
                  <IconButton icon={EyeOpenIcon} onClick={() => setShowPermitView(true)} />
                </Tooltip>}
                {editable && <Tooltip position={Position.TOP} appearance="card" content={"Edit Permit Application Forms"}>
                  <IconButton icon={EditIcon} onClick={() => setShowPermitForm(true)} />
                </Tooltip>}
              </>)}
            </div>
            <div className="flex items-center space-x-2">
              { !!selectedApplication && !isDisabled && (<>
                  <Tooltip position={Position.TOP} appearance="card" content={isRejects ? "Recomply Assessment?" : receivingOnly ? "Received Documents" : step === 5 || step === 8 ? "Paid the amount?" : step === 10 ? "Permit Claimed?" : "Approve Application"}><IconButton icon={receivingOnly ? DownloadIcon : ConfirmIcon} onClick={onApprove} intent="success" /></Tooltip>
                  { !isRejects && !receivingOnly && step !== 5 && step !== 8 && step !== 10 && <Tooltip position={Position.TOP} appearance="card" content="Reject Application"><IconButton icon={<AutomaticUpdatesIcon color="warning" />} onClick={onReject} /></Tooltip> }
                  { (step === 1 || step === 2) && <Tooltip position={Position.TOP} appearance="card" content="Completely Reject Application (Decline)"><IconButton icon={CrossIcon} intent="danger" onClick={onCancel} /></Tooltip>}
                </>)
              }
              <Tooltip position={Position.TOP} appearance="card" content="Refresh List"><IconButton icon={RefreshIcon} onClick={refreshList} /></Tooltip>
            </div>
          </div>
        </Table.Cell>
      </Table.Row>
      <Table minWidth={'fit-content'}>
        <Table.Head>
          { selectedColumns.map((column: any) => (
            <Table.TextHeaderCell key={column.value}>{column.label}</Table.TextHeaderCell>
          ))}
        </Table.Head>
        <Table.Body height={240}>
          {!isLoading ? (paginatedDataList.length > 0 ? paginatedDataList.map((appl: any, index: number) => (
            <Table.Row
              key={appl._id}
              backgroundColor={appl.deactivated ? '#ccc' : undefined}
              isSelectable
              onSelect={() => onSelectedApplication(index)}
              intent={
                selectedApplication?._id === appl._id
                ? 'success'
                : 'none'
              }
              isHighlighted={selectedApplication?._id === appl._id} isSelected={selectedApplication?._id === appl._id}
            >
              { selectedColumns.map((column) => (
                <Table.TextCell key={column.value} textProps={{ color: appl.deactivated ? '#888' : undefined}} >{appl[column.value]}</Table.TextCell>
              ))}
            </Table.Row>
          )) : <Table.Row><Table.TextCell textProps={{ textAlign: "center", fontWeight: "semibold", fontSize: "20px", color: "gray600" }}>No Records Yet</Table.TextCell></Table.Row>) : <LoadingComponent />}
        </Table.Body>
      </Table>
      <div className="px-10 py-2 w-full flex flex-nowrap justify-center">
        <p className="flex-grow">Items {(page * 10) + 1} - {Math.max(0, (page * 10) + paginatedDataList.length)} / {datalist.length}</p>
        <Pagination totalPages={totalPages} page={page} onPageChange={setPage}/>
        <p className="flex-grow text-right">Pages {Math.min(page + 1, totalPages)} / {totalPages}</p>
      </div>
      <Pane>
        <Dialog
          isShown={!!selectedApplication && viewable && isShownPermitView}
          shouldCloseOnOverlayClick={false}
          title={"Application # " + selectedApplication?.applicationNo}
          onCloseComplete={onEditClose}
          hasFooter={false}
          width={1200}
        >
          {({ close }) => (
            <div className="overflow-hidden h-[560px] w-full">
              <div className="relative w-full mb-4 max-h-[500px]">
                <div className="px-4 pb-4 pt-1 h-full w-full">
                  { printable && (
                    <div className="absolute w-[50px] right-16 bg-white rounded-b text-right space-x-2">
                      <Button iconBefore={PrintIcon} is={Link} target={'_blank'} href={'/' + role + '/permit/print?appNo=' + selectedApplication?.applicationNo + '&permit=' + ([Permits.BuildingPermit, Permits.ElectricalPermit, Permits.SanitaryPermit].indexOf(tabs[selectedTabPermitFormIndex] as Permits) + 1)}>Print</Button>
                    </div>
                  )}
                  <Tablist marginBottom={16} flexBasis={340}>
                    {tabs.map((tab, index) => (
                      <Tab
                        aria-controls={`form-panel-${tab}`}
                        isSelected={index === selectedTabPermitFormIndex}
                        key={tab}
                        onSelect={() => setSelectedIndex(index)}
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tablist>
                  <Pane padding={16} background="tint1" flex="1" maxHeight={450} overflowY="auto">
                    {tabs.map((tab, index) => (
                      <Pane
                        aria-labelledby={tab}
                        aria-hidden={index !== selectedTabPermitFormIndex}
                        display={index === selectedTabPermitFormIndex ? 'block' : 'none'}
                        key={tab}
                        role="tabpanel"
                      >
                        {tab === Permits.BuildingPermit && <BuildingPermitPrintDocument data={selectedApplication} />}
                        {tab === Permits.ElectricalPermit && <ElectricalPermitPrintDocument data={selectedApplication} />}
                        {tab === Permits.SanitaryPermit && <SanitaryPermitPrintDocument data={selectedApplication} />}
                      </Pane>
                    ))}
                  </Pane>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </Pane>
      <Pane>
        <Dialog
          isShown={!!selectedApplication && editable && isShownPermitForm}
          shouldCloseOnOverlayClick={false}
          title={"Edit Permit Registration Form"}
          onCloseComplete={onEditClose}
          hasFooter={false}
          width={1200}
        >
          {({ close }) => (
            <div className="overflow-hidden h-[560px] w-full">
              <form action={actionUpdate} onInvalid={onPermitApplicationEditInvalid}  className="relative w-full mb-4 max-h-[500px]">
                <div className="px-4 pb-4 pt-1 h-full w-full">
                  <Tablist marginBottom={16} flexBasis={340}>
                    {tabs.map((tab, index) => (
                      <Tab
                        aria-controls={`form-panel-${tab}`}
                        isSelected={index === selectedTabPermitFormIndex}
                        key={tab}
                        onSelect={() => setSelectedIndex(index)}
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tablist>
                  <Pane padding={16} background="tint1" flex="1" maxHeight={450} overflowY="auto">
                    {tabs.map((tab, index) => (
                      <Pane
                        aria-labelledby={tab}
                        aria-hidden={index !== selectedTabPermitFormIndex}
                        display={index === selectedTabPermitFormIndex ? 'block' : 'none'}
                        key={tab}
                        role="tabpanel"
                      >
                        {tab === Permits.BuildingPermit && <BuildingPermitForm data={selectedApplication} />}
                        {tab === Permits.ElectricalPermit && <ElectricalPermitForm data={selectedApplication} />}
                        {tab === Permits.SanitaryPermit && <SanitaryPermitForm data={selectedApplication} />}
                      </Pane>
                    ))}
                  </Pane>
                  <div className="sticky w-full bottom-0 left-0 z-50 bg-white rounded-b pt-3 text-right space-x-2">
                    <FormButton type="reset" onClick={close} label="CLOSE" size="large" />
                    <FormButton iconBefore={ConfirmIcon} label="UPDATE" size="large" appearance="primary" fontWeight="bold" />
                  </div>
                </div>
              </form>
            </div>
          )}
        </Dialog>
      </Pane>
      <Pane>
        <Dialog
          isShown={!!selectedApplication && (isShownApprove || isShownReject || isShownCancel)}
          title={isShownApprove ? (isRejects ? "Approve for Re-assessment of documents?" : receivingOnly ? "Received" : (step === 5 || step === 8) ? "Confirm Paid Assessment Amount?" : step === 10 ? "Confirm claimed completed permit?" : "Approve") + " (Step " + step + ")" : isShownReject ? "Reject (Step " + step + ")" : isShownCancel ? "Decline/Cancel (Step " + step + ")" : ""}
          onCloseComplete={() => {
            setShowApprove(false);
            setShowReject(false);
            setShowCancel(false);
            onMayorsPermitFileRemove();
          }}
          confirmLabel={isShownApprove ? "Yes, " + (isRejects ? "Re-assess documents" : receivingOnly ? "Confirm Received" : (step === 5 || step === 8) ? "Assessment Amount Paid" : "Approve") : isShownReject ? "Yes, Reject" : isShownCancel ? "Yes, Decline Permit Application" : ""}
          cancelLabel="No, Cancel"
          intent={isShownApprove ? "success" : isShownReject ? "danger" : "default"}
          isConfirmDisabled={(isShownApprove && ((withMayorsPermit && mayorsPermitFile.length === 0) || (!isRejects && !receivingOnly && !isDisabled && (step === 3 || step === 4 || step === 7) && amountValue < 1))) || (isShownReject && !isRejects && !receivingOnly && !isDisabled && (step === 4 || step === 7) && !rejectReason)}
          onConfirm={() => isShownApprove ? onApproveApplication() : isShownReject ? onRejectApplication() : isShownCancel ? onDeclineApplication() : null}
          isConfirmLoading={pendingLoading}
        >
          <Paragraph fontWeight={600} fontSize={18} marginBottom={8}>{isShownApprove ? (isRejects ? "Confirm re-assessment of documents of the following" : receivingOnly ? "Have you receive documents" : (step === 5 || step === 8) ? "Did the applicant paid the assessment amount" : step === 10 ? "Did the applicant received the completed permit" : "Do you want to approve (step " + step + ")") : isShownReject ? "Do you want to reject (step " + step + ")" : ""}?</Paragraph>
          { receivingOnly && withMayorsPermit && (
            <Pane>
              <FileUploader
                label="Upload Mayor's Permit Photo * [Required]"
                description="You can upload 1 photo. File can be up to 10 MB. Double-click to view the image selected"
                maxSizeInBytes={10 * 1024 ** 2}
                maxFiles={1}
                acceptedMimeTypes={[MimeType.png, MimeType.jpeg, MimeType.webp]}
                onChange={onMayorsPermitFileChange}
                onRejected={onMayorsPermitFileRejected}
                renderFile={(file) => {
                  const { name, size, type } = file
                  const fileRejection = fileRejections.find((fileRejection) => fileRejection.file === file)
                  const { message } = fileRejection || {}
                  return (
                    <FileCard
                      key={name}
                      isInvalid={fileRejection != null}
                      name={name}
                      onRemove={onMayorsPermitFileRemove}
                      sizeInBytes={size}
                      type={type}
                      validationMessage={message}
                      cursor="pointer"
                      onDoubleClick={() => setShowImagePreviewOverlay(true)}
                    />
                  )
                }}
                values={mayorsPermitFile}
              />
            </Pane>
          )}
          <div className="grid grid-cols-3 gap-1 *:border-y *:p-1">
            { !isRejects && !receivingOnly && !isDisabled && isShownApprove && (step === 3 || step === 4 || step === 7) && (
              <>
                <Paragraph fontWeight={500}><span className="italic uppercase text-xs text-red-500">[REQUIRED]</span><br />Assessment Amount *:</Paragraph>
                <Paragraph gridColumn="2 / span 2"><span className="text-lg pr-1 font-bold">&#8369;</span> <TextInput height="100%" type="number" value={amountValue} onChange={(ev: any) => setAmountValue(ev.target.value)} /></Paragraph>
              </>
            )}
            { !isRejects && !receivingOnly && !isDisabled && isShownReject && (step === 4 || step === 7) && (
              <>
                <Paragraph fontWeight={500}><span className="italic uppercase text-xs text-red-500">[REQUIRED]</span><br />Reason for Rejection *:</Paragraph>
                <Paragraph gridColumn="2 / span 2"><Textarea height="auto" value={rejectReason} onChange={(ev: any) => setRejectReason(ev.target.value)} /></Paragraph>
              </>
            )}
            { !isRejects && step === 5 && !receivingOnly && (
              <>
                <Paragraph fontWeight={500} color="danger">OBO Assessment Amount:</Paragraph>
                <Paragraph gridColumn="2 / span 2" color="danger"><span className="font-bold text-lg">{Number.parseFloat(selectedApplication?.amountOBO?.toString() || '0').toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span></Paragraph>
                <Paragraph fontWeight={500} color="danger">MPDC Assessment Amount:</Paragraph>
                <Paragraph gridColumn="2 / span 2" color="danger"><span className="font-bold text-lg underline">{Number.parseFloat(selectedApplication?.amountMPDC?.toString() || '0').toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span></Paragraph>
                <Paragraph fontWeight={500} color="danger">Total Assessment Amount:</Paragraph>
                <Paragraph gridColumn="2 / span 2" color="danger"><span className="font-bold text-lg decoration-double underline">{(Number.parseFloat(selectedApplication?.amountOBO?.toString() || '0') + Number.parseFloat(selectedApplication?.amountMPDC?.toString() || '0')).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span></Paragraph>
              </>
            )}
            { !isRejects && step === 8 && !receivingOnly && (
              <>
                <Paragraph fontWeight={500} color="danger">Total Assessment Amount:</Paragraph>
                <Paragraph gridColumn="2 / span 2" color="danger"><span className="font-bold text-lg">{(Number.parseFloat(selectedApplication?.amountBFP?.toString() || '0')).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })}</span></Paragraph>
              </>
            )}
            <Paragraph fontWeight={500}>Application No.:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedApplication?.applicationNo}</Paragraph>
            <Paragraph fontWeight={500}>Location of Construction:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{displayLocation(selectedApplication?.locationOfConstruction)}</Paragraph>
            <Paragraph fontWeight={500}>TCT No.:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedApplication?.locationOfConstruction?.tctNo}</Paragraph>
            <Paragraph fontWeight={500}>Current Tax Dec. No.:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedApplication?.locationOfConstruction?.taxDecNo}</Paragraph>
            <Paragraph fontWeight={500}>Full Name:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{displayFullName(selectedApplication?.user as UserDocument)}</Paragraph>
            <Paragraph fontWeight={500}>Email address:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{(selectedApplication?.user as UserDocument)?.email}</Paragraph>
            <Paragraph fontWeight={500}>Contact No.:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{(selectedApplication?.user as UserDocument)?.contactNo}</Paragraph>
            <Paragraph fontWeight={500}>TIN:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{(selectedApplication?.user as UserDocument)?.tin}</Paragraph>
            <Paragraph fontWeight={500}>Lot Owner / Authorized Representative: <span className={clsx('italic text-xs', !!selectedApplication?.representative?.lotOwnerAuthorizedRepresentative ? 'text-green-800' : 'text-red-800')}>{!!selectedApplication?.representative?.lotOwnerAuthorizedRepresentative ? 'YES' : 'N/A'}</span></Paragraph>
            <Paragraph gridColumn="2 / span 2">{!!selectedApplication?.representative?.lotOwnerAuthorizedRepresentative ? selectedApplication?.representative?.lotOwnerAuthorizedRepresentative : 'N/A'}</Paragraph>
            { !isRejects && step === 10 && (<>
              <Paragraph fontWeight={500}>Status:</Paragraph>
              <Paragraph gridColumn="2 / span 2" color="green"><span className="italic text-lg">Claimable and Completed</span></Paragraph>
            </>)}
            { isRejects && (<>
              <Paragraph fontWeight={500}>Status:</Paragraph>
              <Paragraph gridColumn="2 / span 2" color="danger"><span className="italic text-lg">Rejected (for compliance)</span></Paragraph>
              <Paragraph fontWeight={500}>Reason:</Paragraph>
              <Paragraph gridColumn="2 / span 2" color="danger">{!!selectedApplication ? [...selectedApplication.status]?.pop()?.rejectReason : ''}</Paragraph>
            </>)}
          </div>
        </Dialog>
      </Pane>
      {showImagePreviewOverlay && (
        <div className="fixed w-screen h-screen left-0 top-0 z-50">
          <div className="relative w-full h-full bg-black/50 bg-blur flex items-center justify-center">
            <div className="absolute left-0 top-0 h-full w-full z-1" onClick={onImagePreviewClose} />
            <div className="relative bg-white rounded-lg h-[90%] p-2 z-20">
              <IconButton icon={CrossIcon} intent="danger" appearance='minimal' position="absolute" right={0} top={0} zIndex={100} onClick={onImagePreviewClose} />
              <div className="object-contain overflow-auto h-[calc(100%-2em)] w-full min-w-[200px] mt-6 rounded shadow border border-slate-200">
                { !imageUrl ? <LoadingComponent /> : <Image src={imageUrl} alt="Mayor's Permit Photo Preview" title="Mayor's Permit Photo Preview" width={1000} height={1000} /> }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}