'use client';;
import { removeAdminDepartment } from "@/actions/superadmin";
import OCSTable from "@/components/table";
import { DepartmentDocument, Roles } from "@/lib/modelInterfaces";
import type { TableColumnProps } from "@/lib/types";
import clsx from "clsx";
import {
  AddIcon,
  Avatar,
  ConfirmIcon,
  CrossIcon,
  EditIcon,
  PlusIcon,
  RemoveIcon,
  SmallCrossIcon,
  toaster,
  UpdatedIcon,
  WarningSignIcon,
} from "evergreen-ui";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AddAdminAccountModal from "./addAdminAccountModal";
import AddAdminDepartmentModal from "./addAdminDepartmentModal";
import type { AccountsColumns } from './types';

const objectURLS = new Map<string, string>();

function getPhotoURL(id?: string, photoBuffer?: Buffer, type?: string): string | undefined
{
  // convert buffer to object url
  if (!photoBuffer || !id || !type) return undefined;
  if (objectURLS.has(id)) return objectURLS.get(id);
  const objectURL = URL.createObjectURL(new Blob([photoBuffer], { type }));
  objectURLS.set(id, objectURL);
  return objectURL;
}

function getAdminAccountsColumns({ onRemoveDepartment, onAddDepartment, onUpdate, onToggleActive }: Readonly<{ onUpdate: (id: string) => void, onToggleActive: (id: string) => void, onAddDepartment: (id: string) => void, onRemoveDepartment: (id: string, departmentId: string) => void }>): TableColumnProps[]
{
  return [
    {
      label: 'Photo', field: "photo", align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex items-center justify-center gap-4">
          <Avatar src={!!row.photo ? getPhotoURL(row.photo?._id, Buffer.from(row.photo?.file), row.photo?.mimeType) : ''} name={row.firstName + " " + row.lastName} size={48} />
        </div>
      ),
    },
    {
      label: "Employee ID", field: "employeeId", sortable: true, searchable: true, align: 'center'
    },
    {
      label: "Prefix Name", field: "prefixName", sortable: true, searchable: true,
    },
    {
      label: "First Name", field: "firstName", sortable: true, searchable: true,
    },
    {
      label: "Middle Name", field: "middleName", sortable: true, searchable: true,
    },
    {
      label: "Last Name", field: "lastName", sortable: true, searchable: true,
    },
    {
      label: "Suffix Name", field: "suffixName", sortable: true, searchable: true,
    },
    {
      label: 'Email Address', field: "email", sortable: true, searchable: true,
    },
    {
      label: 'Has Registered E-Signature', field: "hasRegisteredESignature", sortable: true, align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex justify-center items-center">
          {!row.hasRegisteredSignature ? <span className="text-green-700 flex flex-nowrap gap-x-1"><ConfirmIcon size={15} color="green" /> YES</span> : <span className="text-red-500 flex flex-nowrap"><SmallCrossIcon color="red" /> NO</span>}
        </div>
      )
    },
    {
      label: "Departments", field: "departments", align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex flex-col justify-start items-start min-w-32 gap-y-1">
          { row.departmentIds.map((department: DepartmentDocument, index: number) => (
            <div key={"dep" + index} className={
              clsx(
                "captitalize flex-grow p-2 rounded-full mx-auto flex w-full justify-center text-wrap gap-x-1",
                index % 2 === 0 ? "bg-sky-300 text-black" : "bg-green-300 text-black",
              )}
            >
              <span className="flex-grow px-2">{department.name}</span>
              <button type="button" onClick={() => onRemoveDepartment(row._id, department._id as string)}  title="Remove Assigned Department" className="text-red-500 ml-1 flex-shrink pr-1">
                <CrossIcon size={12} />
              </button>
            </div>
          ))}
          {
            row.departmentIds.length === 0 && (
              <button type="button" title="No Assigned Departments" className="mx-auto text-yellow-500 drop-shadow"><WarningSignIcon size={25} /></button>
            )
          }
          </div>
      ),
    },
    {
      label: "Status", field: "deactivated", sortable: true, searchable: true,
      render: (row: AccountsColumns) => (
        <div className={
          clsx(
            "captitalize p-2 rounded-full max-w-32 mx-auto text-center",
            !row.deactivated && "bg-green-500 text-green-900 font-[700]",
            !!row.deactivated && "bg-gray-400 text-white",
          )}
        >
          {row.deactivated? "Deactivated" : "Active"}
        </div>
      ),
    },
    {
      label: "Action", field: "actions", align: "center",
      render: (row: AccountsColumns) => (
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => onAddDepartment(row._id)} title="Assign to Department">
            <AddIcon />
          </button>
          <button type="button" onClick={() => onUpdate(row._id)} title="Edit">
            <EditIcon />
          </button>
          <button type="button" onClick={() => onToggleActive(row._id)} title="Active/Deactivate Account" className={clsx(row.deactivated ? "text-green-500" : "text-red-500")}>
            {row.deactivated ? <UpdatedIcon /> : <RemoveIcon />}
          </button>
        </div>
      )
    },
  ]
}

export default function AdminAccountsPage() {
  const [data, setData] = useState<AccountsColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDepartmentNames = useMemo(() => data?.find((d) => d._id === selectedId)?.map((d: AccountsColumns) => d.departmentIds?.map((dept) => dept.name) || []), [selectedId, data])

  const pathname = usePathname();

  const onUpdate = useCallback((id: string) => {
    console.log(`Updating: ${id}`);
  }, []);

  const onToggleActive = useCallback((id: string) => {
    console.log(`Activate/Deactivate: ${id}`);
  }, []);

  const onAddDepartment = useCallback((id: string) => {
    console.log(`Add department: ${id}`);
    setSelectedId(id);
    setDeptOpen(true);
  }, []);

  const onRemoveDepartment = useCallback((id: string, departmentId: string) => {
    Swal.fire({
      title: 'Remove Department from Employee ID ' + data.find((d) => d._id == id)?.employeeId + '?',
      text: data.find((d) => d._id === id)?.departmentIds?.find((d) => d._id == departmentId)?.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          const removeDept = removeAdminDepartment.bind(null, { id, departmentId });
          removeDept()
            .then(({ success, error } ) => {
              if (error) {
                toaster.danger(error);
              } else {
                toaster.success(success)
              }
            })
            .catch(console.log)
        }
      })
  }, [data]);

  const adminColumns = getAdminAccountsColumns({
    onUpdate,
    onToggleActive,
    onAddDepartment,
    onRemoveDepartment,
  });

  const getData = useCallback(() => {
    if (data.length === 0) {
      setLoading(true);
    }
    fetch('/' + Roles.SuperAdmin + '/api/admins')
      .then((response) => response.json())
      .then(({ result }) => setData(result))
      .catch(console.log)
      .finally(() => setLoading(false))
  }, [data])

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (objectURLS.size > 0) {
        objectURLS.forEach((url) => URL.revokeObjectURL(url));
        objectURLS.clear();
      }
    }
  }, [])

  return (
    <div className="px-8 py-4">
      <h1 className="text-[25px] font-[600] mb-4">Admin Account Management</h1>
      <OCSTable loading={loading} columns={adminColumns} data={data} searchable toolbars={[
        (<button key={"addadmin1"} type="button" onClick={() => setOpen(true)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><PlusIcon display="inline" marginRight={4} size={12} />Add Admin Account</button>),
      ]} />
      <AddAdminAccountModal open={open} onClose={() => setOpen(false)} onRefresh={() => getData()} />
      <AddAdminDepartmentModal id={selectedId} departments={selectedDepartmentNames} open={deptOpen} onClose={() => setDeptOpen(false)} onRefresh={() => getData()} />
    </div>
  )
}