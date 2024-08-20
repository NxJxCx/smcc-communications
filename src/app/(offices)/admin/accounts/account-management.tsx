'use client';
import { updateAccount } from '@/actions/auth';
import { signup } from '@/actions/signup';
import { FormButton } from '@/components/forms/button';
import LoadingComponent from '@/components/loading';
import { UserRoles, VerificationStatus, type UserDocument } from '@/lib/models/interfaces';
import { ResponseFormState } from '@/lib/types';
import clsx from 'clsx';
import {
  Alert,
  AutomaticUpdatesIcon,
  BlockedPersonIcon,
  Button,
  CrossIcon,
  Dialog,
  EditIcon,
  FilterListIcon,
  Icon,
  IconButton,
  NewPersonIcon,
  Pagination,
  Pane,
  Paragraph,
  Position,
  RefreshIcon,
  SelectField,
  SelectMenu,
  StatusIndicator,
  Table,
  TextInputField,
  toaster,
  Tooltip
} from 'evergreen-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

interface ColumnsProp {
  label: string;
  value: string;
}

type ColumnsType = ColumnsProp[]

const columns: ColumnsType = [
  { label: 'First Name', value: 'firstName' },
  { label: 'Middle Name', value:'middleName' },
  { label: 'Last Name', value: 'lastName' },
  { label: 'Email', value: 'email' },
  { label: 'Verified?', value:'emailVerified' },
  { label: 'Phone No.', value: 'contactNo' },
  { label: 'Verified?', value:'contactVerified' },
  { label: 'Address', value: 'address' },
  { label: 'TIN', value: 'tin' },
  { label: 'CTC No.', value: 'ctcNo' },
  { label: "Gov't ID", value: 'govId' }
]

export default function AccountManagementTable({
  role, onSelected = () => {},
  onLoading = () => {},
  onDeactivateAccount = (success: boolean, user?: UserDocument) => {},
  onActivateAccount = (success: boolean, user?: UserDocument) => {},
} : Readonly<{
  role: UserRoles;
  onSelected?: (user?: UserDocument) => void;
  onLoading?: (isLoading: boolean) => void;
  onDeactivateAccount?: (success: boolean, user?: UserDocument) => void;
  onActivateAccount?: (success: boolean, user?: UserDocument) => void;
}>) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortcontroller] = useState<AbortController>(new AbortController());
  const [datalist, setDatalist] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserDocument|undefined>(undefined);
  const [page, setPage] = useState<number>(0);
  const displayAddress = useCallback((user: UserDocument) => ((user.address.no || '') + ` ${user.address.street}, ${user.address.barangay}, ${user.address.cityMunicipality}, ${user.address.province}, ${user.address.zipCode}`).trim(), [])
  const filterID = useCallback((id?: string) => !!id ? id!.substring(0, 2) + '****' + id!.substring(id!.length > 3 ? id!.length - 3 : id!.length -1) : 'N/A', [])
  const filteredDataList = useMemo(() => {
    return datalist.filter((user: UserDocument) => {
      return user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.middleName?.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.contactNo.toLowerCase().includes(search.toLowerCase()) ||
        displayAddress(user).toLowerCase().includes(search.toLowerCase()) ||
        user.tin?.toLowerCase().includes(search.toLowerCase()) ||
        user.ctc?.no?.toLowerCase().includes(search.toLowerCase()) ||
        user.govId?.no?.toLowerCase().includes(search.toLowerCase()) ||
        user.position?.toLocaleLowerCase().includes(search.toLowerCase())
    })
  }, [search, datalist, displayAddress]);
  const totalPages = useMemo(() => Math.ceil(filteredDataList.length / 10), [filteredDataList]);
  const paginatedDataList = useMemo<any[]>(() => {
    setSelectedUser(undefined);
    return filteredDataList.slice(page * 10, (page + 1) * 10).map((user: UserDocument) => ({
      ...user,
      emailVerified: user.emailVerified.status === VerificationStatus.approved
        ? new Date(user.emailVerified.updatedAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'})
        : <Icon color="danger" icon={CrossIcon} />,
      contactVerified: user.contactVerified.status  === VerificationStatus.approved
        ? new Date(user.contactVerified.updatedAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'})
        : <Icon color="danger" icon={CrossIcon} />,
      address: displayAddress(user),
      tin: filterID(user.tin),
      ctcNo: filterID(user.ctc?.no),
      govId: filterID(user.govId?.no)
    }));
  }, [filteredDataList, page, displayAddress, filterID]);

  useEffect(() => {
    if (onLoading) {
      onLoading(isLoading);
    }
    // eslint-disable-next-line
  }, [isLoading]);

  const onAbort = useCallback((_: Event) => {
    setIsLoading(false);
  }, []);

  const [isShownAddUser, setShownAddUser] = useState<boolean>(false);

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line
  }, []);

  const columnsFinal = useMemo<ColumnsType>(() => role !== UserRoles.User ? [{ label: 'Position', value: 'position' }, ...columns] : columns, [role]);

  const [selectedColumnsState, setSelectedColumns] = useState<string[]>(columnsFinal.map((col: any) => col.value));
  const selectedColumns = useMemo(() => selectedColumnsState.length === 0 ? columnsFinal : columnsFinal.filter((item: ColumnsProp) => selectedColumnsState.includes(item.value)), [selectedColumnsState, columnsFinal]);

  const onSelectedUser = useCallback((index?: number) => {
    if (index === undefined) {
      setSelectedUser(undefined);
      onSelected(undefined);
    } else {
      const ftl = filteredDataList.slice(page * 10, (page + 1) * 10);
      const user = ftl[index];
      setSelectedUser(user);
      onSelected(user);
    }
  }, [onSelected, filteredDataList, page]);

  const refreshList = useCallback(() => {
    onSelectedUser(undefined);
    const url = new URL('/admin/api/accounts', window.location.origin);
    url.searchParams.append('acct', role);
    abortController.abort()
    const newAbortController = new AbortController()
    newAbortController.signal.onabort = onAbort;
    setAbortcontroller(newAbortController);
    setIsLoading(true);
    fetch(url, { signal: newAbortController.signal })
      .then((response: Response) => response.json())
      .then(({ data }: { data: UserDocument[] }) => {
        setDatalist(data.map((user: UserDocument) => user));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false))
  }, [role, abortController, onAbort, onSelectedUser]);

  const signupAction = signup.bind(null, role);
  const [state, action] = useFormState<ResponseFormState>(signupAction as any, undefined);
  const { pending } = useFormStatus()
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [contactNo, setContactNo] = useState<string>('');
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [contactExists, setContactExists] = useState<boolean>(false);
  const [abortEmailController, setAbortEmailController] = useState<AbortController>(new AbortController());
  const [abortContactController, setAbortContactController] = useState<AbortController>(new AbortController());
  const formRef = useRef<HTMLFormElement>(null);

  const onEmailAddress = useCallback((ev: any) => {
    ev.preventDefault();
    setShowAlert(false);
    const email = ev.target.value;
    setEmailAddress(email);
    const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!!email && email.length > 0) {
      if (emailRegEx.test(email)) {
        // check if email exists
        const url = new URL('/signup/steps/api/exists', window.location.origin)
        url.searchParams.append('email', email)
        abortEmailController.abort()
        const newAbortController = new AbortController()
        setAbortEmailController(newAbortController)
        fetch(url, {
          signal: newAbortController.signal,
        })
          .then((response: Response) => response.json())
          .then((exists: boolean) => {
            setEmailExists(exists)
          })
          .catch(() => {
            setEmailExists(false)
          })
      }
    }
  }, [abortEmailController]);

  const onContactNo = useCallback((ev: any) => {
    ev.preventDefault();
    setShowAlert(false);
    const phoneNo = ev.target.value;
    setContactNo(phoneNo.substring(3));
    const phoneRegEx = /^\+639[0-9]{9}$/;
    if (!!phoneNo && phoneNo.length > 3) {
      if (phoneRegEx.test(phoneNo)) {
        // check if phone exists
        const url = new URL('/signup/steps/api/exists', window.location.origin)
        url.searchParams.append('phone', phoneNo)
        abortContactController.abort()
        const newAbortController = new AbortController()
        setAbortContactController(newAbortController)
        fetch(url, {
          signal: newAbortController.signal,
        })
          .then((response: Response) => response.json())
          .then((exists: boolean) => {
            setContactExists(exists)
          })
          .catch(() => {
            setContactExists(false)
          })
      }
    }
  }, [abortContactController]);

  const onInputChange = useCallback(() => {
    setShowAlert(false)
  }, []);

  useEffect(() => {
    if (!pending && !!state?.success) {
      formRef.current!.reset();
      setShowAlert(false);
      setShownAddUser(false);
      toaster.success(state!.message)
      refreshList();
    }
    if (!pending && (!!state?.errors || !state?.success)) {
      setShowAlert(true);
    }
    // eslint-disable-next-line
  }, [state])

  const [isShowDeactivateUser, setShowDeactivateUser] = useState<boolean>(false);
  const [isShowActivateUser, setShowActivateUser] = useState<boolean>(false);
  const [isShowUpdateUser, setShowUpdateUser] = useState<boolean>(false);
  const formRefUpdate = useRef<HTMLFormElement>(null);

  const onDeactivateAccountUser = useCallback(() => {
    if (!!selectedUser) {
      const url = new URL('/admin/api/accounts', window.location.origin);
      url.searchParams.append('acct', role);
      url.searchParams.append('uid', selectedUser._id as string);
      fetch(url, { method: 'DELETE' })
        .then((response: Response) => response.json())
        .then((success: boolean) => {
          onDeactivateAccount(success, selectedUser);
          if (success) {
            toaster.success('Account successfully deactivated!');
            refreshList();
          } else {
            toaster.danger('Failed to deactivate account!');
          }
        })
        .catch(() => {
          toaster.danger('Failed to deactivate account!');
        })
    }
  }, [selectedUser, refreshList, role, onDeactivateAccount]);

  const onActivateAccountUser = useCallback(() => {if (!!selectedUser) {
    const url = new URL('/admin/api/accounts', window.location.origin);
    url.searchParams.append('acct', role);
    url.searchParams.append('uid', selectedUser._id as string);
    url.searchParams.append('action', 'activate');
    fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        uid: selectedUser._id as string,
      })
    })
      .then((response: Response) => response.json())
      .then((success: boolean) => {
        onActivateAccount(success, selectedUser);
        if (success) {
          toaster.success('Account successfully activated!');
          refreshList();
        } else {
          toaster.danger('Failed to activate account!');
        }
      })
      .catch(() => {
        toaster.danger('Failed to activate account!');
      })
    }
  }, [selectedUser, refreshList, role, onActivateAccount]);

  const [stateUpdate, actionUpdate] = useFormState<ResponseFormState>(updateAccount as any, undefined);

  const { pending: pendingUpdate } = useFormStatus()

  const [updateRoleValue, setUpdateRoleValue] = useState<string>('');

  const onSetShowUpdateUser = useCallback((ev: any) => {
    ev.preventDefault()
    setEmailAddress(selectedUser!.email)
    setContactNo(selectedUser!.contactNo.substring(3))
    setShowUpdateUser(true)
  }, [selectedUser]);

  useEffect(() => {
    if (!pendingUpdate && !!stateUpdate?.success) {
      formRefUpdate.current!.reset();
      setShowAlert(false);
      setShowUpdateUser(false);
      toaster.success(stateUpdate!.message)
      refreshList();
    }
    if (!pendingUpdate && (!!state?.errors || !state?.success)) {
      setShowAlert(true);
    }
    // eslint-disable-next-line
  }, [stateUpdate]);

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
            <Tooltip position={Position.TOP} appearance="card" content="Filter Columns"><IconButton intent={selectedColumns.length !== columnsFinal.length ? "success" : "none"} appearance={selectedColumns.length !== columnsFinal.length ? "primary" : "default"} icon={FilterListIcon} /></Tooltip>
          </SelectMenu>
          <Table.SearchHeaderCell placeholder='Search...' value={search}onInput={(ev: any) => setSearch(ev.target.value)} />
        </Table.Cell>
        <Table.Cell>
          <div className="flex items-center justify-end space-x-2 w-full">
            { !!selectedUser && (<>
              { !selectedUser.deactivated && (
                <Tooltip position={Position.TOP} appearance="card" content="Update Account"><IconButton icon={EditIcon} onClick={onSetShowUpdateUser} /></Tooltip>
              )}
              { selectedUser.deactivated ? (
                <Tooltip position={Position.TOP} appearance="card" content="Activate Account"><IconButton icon={AutomaticUpdatesIcon} intent="success" onClick={() => setShowActivateUser(true)} /></Tooltip>
              ) : (
                <Tooltip position={Position.TOP} appearance="card" content="Deactivate Account"><IconButton icon={BlockedPersonIcon} intent="danger" onClick={() => setShowDeactivateUser(true)} /></Tooltip>
              )}
              </>)
            }
            <Tooltip position={Position.TOP} appearance="card" content="Refresh List"><IconButton icon={RefreshIcon} onClick={refreshList} /></Tooltip>
            <Tooltip position={Position.TOP} appearance="card" content="Add"><IconButton icon={NewPersonIcon} onClick={() => setShownAddUser(true)} /></Tooltip>
          </div>
        </Table.Cell>
      </Table.Row>
      <Table>
        <Table.Head>
          { selectedColumns.map((column: any) => (
            <Table.TextHeaderCell key={column.value}>{column.label}</Table.TextHeaderCell>
          ))}
        </Table.Head>
        <Table.Body height={240}>
          {!isLoading ? (paginatedDataList.length > 0 ? paginatedDataList.map((user: any, index: number) => (
            <Table.Row key={user._id} backgroundColor={user.deactivated ? '#ccc' : undefined} isSelectable onSelect={() => onSelectedUser(index)} intent={selectedUser?._id === user._id ? (selectedUser?.deactivated ? 'danger' : 'success') : 'none'} isHighlighted={selectedUser?._id === user._id} isSelected={selectedUser?._id === user._id}>
              { selectedColumns.map((column) => (
                <Table.TextCell key={column.value} textProps={{ color: user.deactivated ? '#888' : undefined}} >{user[column.value]}</Table.TextCell>
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
          isShown={isShownAddUser}
          shouldCloseOnOverlayClick={false}
          title={<>
            <div className="mb-2">Add {role.toUpperCase()} Account</div>
            { showAlert && !!state?.errors && (
              <Alert intent="danger" title={state!.message} maxWidth="300px" minWidth="300px" marginX="auto">
                {Object.keys(state!.errors).map((key: string, index: number) => (state!.errors as any)[key].map((msg: string, i: number) => (
                  <StatusIndicator key={(index + 1) * (i + 1)} color="danger">
                    <Paragraph color="danger">{msg}</Paragraph>
                  </StatusIndicator>
                )))}
              </Alert>
            )}
            { showAlert && state?.success === false && state?.message && (
              <Alert intent="danger" title={state!.message} maxWidth="300px" minWidth="300px" marginX="auto">
                <StatusIndicator color="danger">
                  <Paragraph color="danger">{state?.message}</Paragraph>
                </StatusIndicator>
              </Alert>
            )}
          </>}
          onCloseComplete={() => {
            setShownAddUser(false);
            formRef?.current?.reset();
            setEmailAddress('');
            setContactNo('');
          }}
          hasFooter={false}
        >
          {({ close }) => (
            <form ref={formRef} action={action} className="grid grid-cols-6 gap-2 mb-6">
              <TextInputField
                type="email"
                name="email"
                placeholder="xxxxxxxxx@gmail.com"
                label="Email Address"
                gridColumn="span 2 / span 2"
                value={emailAddress}
                onInput={onEmailAddress}
                isInvalid={emailAddress.length === 0 ? false : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) || emailExists)}
                validationMessage={emailAddress.length === 0 ? undefined : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) ? 'Invalid Email' : (emailExists ? 'Email address already taken' : undefined))}
                required
              />
              <TextInputField
                type="tel"
                name="contactNo"
                placeholder="Contact No."
                label="Contact No."
                gridColumn="span 2 / span 2"
                value={'+63' + contactNo}
                onInput={onContactNo}
                maxLength={13}
                isInvalid={contactNo.length === 0 ? false : (!/^\+639[0-9]{9}$/.test('+63' + contactNo) || contactExists)}
                validationMessage={contactNo.length === 0 ? undefined : (!/^\+639[0-9]{9}$/.test('+63' + contactNo) ? 'Invalid Contact No.' : (contactExists ? 'Contact No. already taken' : undefined))}
                required
              />
              { role !== UserRoles.User && (
                <TextInputField
                  name="position"
                  placeholder="Ex: Engineer 1"
                  label="Position"
                  gridColumn="span 2 / span 2"
                  onInput={onInputChange}
                  required
                />
              )}
              <TextInputField
                name="firstName"
                placeholder="First Name"
                label="First Name"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="middleName"
                placeholder="Middle Name"
                label="Middle Name"
                gridColumn="span 2 / span 2"
              />
              <TextInputField
                name="lastName"
                placeholder="Last Name"
                label="Last Name"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                required
              />
              <div className="col-span-6 border-b">
                Address
              </div>
              <TextInputField
                name="address.no"
                label="No."
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
              />
              <TextInputField
                name="address.street"
                label="Street"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="address.barangay"
                label="Barangay"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="address.cityMunicipality"
                label="City/Municipality"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="address.province"
                label="Province"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                required
              />
              <TextInputField
                type="tel"
                name="address.zipCode"
                label="Zip Code"
                gridColumn="span 2 / span 2"
                onInput={onInputChange}
                maxLength={4}
                required
              />
              <div className="flex justify-end items-center col-span-6">
                <Button type="reset" onClick={() => { onInputChange(); close(); }} className="mr-2">Cancel</Button>
                <FormButton disabled={(!/^\+639[0-9]{9}$/.test('+63' + contactNo) || contactExists) || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) || emailExists)} label="Register" intent="success" appearance="primary" />
              </div>
            </form>
          )}
        </Dialog>
      </Pane>
      <Pane>
        <Dialog
          isShown={!!selectedUser && isShowUpdateUser}
          shouldCloseOnOverlayClick={false}
          title={<>
            <div className="mb-2">Update Account</div>
            { showAlert && !!stateUpdate?.errors && (
              <Alert intent="danger" title={stateUpdate!.message} maxWidth="300px" minWidth="300px" marginX="auto">
                {Object.keys(stateUpdate!.errors).map((key: string, index: number) => (stateUpdate!.errors as any)[key].map((msg: string, i: number) => (
                  <StatusIndicator key={(index + 1) * (i + 1)} color="danger">
                    <Paragraph color="danger">{msg}</Paragraph>
                  </StatusIndicator>
                )))}
              </Alert>
            )}
            { showAlert && stateUpdate?.success === false && stateUpdate?.message && (
              <Alert intent="danger" title={stateUpdate!.message} maxWidth="300px" minWidth="300px" marginX="auto">
                <StatusIndicator color="danger">
                  <Paragraph color="danger">{stateUpdate?.message}</Paragraph>
                </StatusIndicator>
              </Alert>
            )}
          </>}
          onCloseComplete={() => {
            setShowUpdateUser(false);
            formRefUpdate?.current?.reset();
            setEmailAddress('');
            setContactNo('');
            setUpdateRoleValue('');
          }}
          hasFooter={false}
        >
          {({ close }) => (
            <form ref={formRefUpdate} action={actionUpdate} className="grid grid-cols-6 gap-2 mb-6">
              <div className="col-span-6">
                <input type="hidden" name="uid" value={selectedUser?._id} />
                <SelectField
                  label="Account Role"
                  name="role"
                  onChange={(ev: any) => setUpdateRoleValue(ev.target.value)}
                  defaultValue={selectedUser?.role || UserRoles.User}
                >
                  {Object.entries(UserRoles).map(([key, value]) => (
                    <option key={value} value={value}>{key}</option>
                  ))}
                </SelectField>
              </div>
              <TextInputField
                type="email"
                name="email"
                placeholder="xxxxxxxxx@gmail.com"
                label="Email Address"
                gridColumn="span 2 / span 2"
                value={emailAddress}
                defaultValue={selectedUser?.email}
                onInput={onEmailAddress}
                isInvalid={(emailAddress.length === 0 || selectedUser?.email === emailAddress) ? false : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) || emailExists)}
                validationMessage={(emailAddress.length === 0 || selectedUser?.email === emailAddress) ? undefined : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) ? 'Invalid Email' : (emailExists ? 'Email address already taken' : undefined))}
                required
              />
              <TextInputField
                type="tel"
                name="contactNo"
                placeholder="Contact No."
                label="Contact No."
                gridColumn="span 2 / span 2"
                value={'+63' + contactNo}
                defaultValue={selectedUser?.contactNo}
                onInput={onContactNo}
                maxLength={13}
                isInvalid={(contactNo.length === 0 || selectedUser?.contactNo.substring(3) === contactNo) ? false : (!/^\+639[0-9]{9}$/.test('+63' + contactNo) || contactExists)}
                validationMessage={(contactNo.length === 0 || selectedUser?.contactNo.substring(3) === contactNo) ? undefined : (!/^\+639[0-9]{9}$/.test('+63' + contactNo) ? 'Invalid Contact No.' : (contactExists ? 'Contact No. already taken' : undefined))}
                required
              />
              { (role !== UserRoles.User || (!!updateRoleValue && updateRoleValue !== UserRoles.User)) && (
                <TextInputField
                  name="position"
                  placeholder="Ex: Engineer 1"
                  label="Position"
                  gridColumn="span 2 / span 2"
                  defaultValue={selectedUser?.position}
                  onInput={onInputChange}
                  required
                />
              )}
              <TextInputField
                name="firstName"
                placeholder="First Name"
                label="First Name"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.firstName}
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="middleName"
                placeholder="Middle Name"
                label="Middle Name"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.middleName}
              />
              <TextInputField
                name="lastName"
                placeholder="Last Name"
                label="Last Name"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.lastName}
                onInput={onInputChange}
                required
              />
              <div className="col-span-6 border-b">
                Address
              </div>
              <TextInputField
                name="address.no"
                label="No."
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.address?.no}
                onInput={onInputChange}
              />
              <TextInputField
                name="address.street"
                label="Street"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.address?.street}
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="address.barangay"
                label="Barangay"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.address?.barangay}
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="address.cityMunicipality"
                label="City/Municipality"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.address?.cityMunicipality}
                onInput={onInputChange}
                required
              />
              <TextInputField
                name="address.province"
                label="Province"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.address?.province}
                onInput={onInputChange}
                required
              />
              <TextInputField
                type="tel"
                name="address.zipCode"
                label="Zip Code"
                gridColumn="span 2 / span 2"
                defaultValue={selectedUser?.address?.zipCode}
                onInput={onInputChange}
                maxLength={4}
                required
              />
              <div className="flex justify-end items-center col-span-6">
                <Button type="reset" onClick={() => { onInputChange(); close(); }} className="mr-2">Cancel</Button>
                <FormButton disabled={(!/^\+639[0-9]{9}$/.test('+63' + contactNo) || (selectedUser?.contactNo.substring(3) !== contactNo && contactExists)) || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) || (selectedUser?.email !== emailAddress && emailExists))} label="Update" intent="success" appearance="primary" />
              </div>
            </form>
          )}
        </Dialog>
      </Pane>
      <Pane>
        <Dialog
          isShown={!!selectedUser && isShowDeactivateUser}
          title="Deactivate Account"
          onCloseComplete={() => {
            setShowDeactivateUser(false);
          }}
          confirmLabel="Yes, Deactivate Account"
          cancelLabel="No, Cancel"
          intent="danger"
          onConfirm={onDeactivateAccountUser}
        >
          <Paragraph color="danger" fontWeight={600} fontSize={18} marginBottom={8}>Are you sure you want to deactivate this account?</Paragraph>
          <div className="grid grid-cols-3 gap-1">
            {!!selectedUser?.position && <Paragraph fontWeight={500}>Position:</Paragraph>}
            {!!selectedUser?.position && <Paragraph gridColumn="2 / span 2">{selectedUser?.position}</Paragraph>}
            <Paragraph fontWeight={500}>Full Name:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedUser?.firstName} {selectedUser?.middleName} {selectedUser?.lastName}</Paragraph>
            <Paragraph fontWeight={500}>Email address:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedUser?.email}
              <span className={clsx("ml-4 font-sans text-xs italic", selectedUser?.emailVerified.status === 'approved' ? 'text-green-600' : 'text-red-600')}>
                {selectedUser?.emailVerified.status === 'approved' ? 'Verified' : 'Not Verified'}
              </span>
            </Paragraph>
            <Paragraph fontWeight={500}>Contact No.:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedUser?.contactNo}
              <span className={clsx("ml-4 font-sans text-xs italic", selectedUser?.contactVerified.status === 'approved' ? 'text-green-600' : 'text-red-600')}>
                {selectedUser?.contactVerified.status === 'approved' ? 'Verified' : 'Not Verified'}
              </span>
            </Paragraph>
          </div>
        </Dialog>
      </Pane>
      <Pane>
        <Dialog
          isShown={!!selectedUser && isShowActivateUser}
          title="Activate Account"
          onCloseComplete={() => {
            setShowActivateUser(false);
          }}
          confirmLabel="Yes, Activate Account"
          cancelLabel="No, Cancel"
          intent="success"
          onConfirm={onActivateAccountUser}
        >
          <Paragraph color="success" fontWeight={600} fontSize={18} marginBottom={8}>Are you sure you want to activate this account?</Paragraph>
          <div className="grid grid-cols-3 gap-1">
            {!!selectedUser?.position && <Paragraph fontWeight={500}>Position:</Paragraph>}
            {!!selectedUser?.position && <Paragraph gridColumn="2 / span 2">{selectedUser?.position}</Paragraph>}
            <Paragraph fontWeight={500}>Full Name:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedUser?.firstName} {selectedUser?.middleName} {selectedUser?.lastName}</Paragraph>
            <Paragraph fontWeight={500}>Email address:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedUser?.email}
              <span className={clsx("ml-4 font-sans text-xs italic", selectedUser?.emailVerified.status === 'approved' ? 'text-green-600' : 'text-red-600')}>
                {selectedUser?.emailVerified.status === 'approved' ? 'Verified' : 'Not Verified'}
              </span>
            </Paragraph>
            <Paragraph fontWeight={500}>Contact No.:</Paragraph>
            <Paragraph gridColumn="2 / span 2">{selectedUser?.contactNo}
              <span className={clsx("ml-4 font-sans text-xs italic", selectedUser?.contactVerified.status === 'approved' ? 'text-green-600' : 'text-red-600')}>
                {selectedUser?.contactVerified.status === 'approved' ? 'Verified' : 'Not Verified'}
              </span>
            </Paragraph>
          </div>
        </Dialog>
      </Pane>
    </div>
  );
}