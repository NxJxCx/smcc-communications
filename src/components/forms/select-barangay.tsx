'use client'

import { Barangay, BarangayList } from "@/lib/barangays";
import { Button, SelectMenu } from "evergreen-ui";
import { Fragment, useState } from "react";

export default function SelectBarangay({ name, title, defaultValue, required = false, buttonProps = {}, readOnly, ...props }: { buttonProps: any, readOnly?: boolean; required?: boolean; defaultValue: Barangay; name?: string, title?: string }) {
  const [selectedBarangay, setSelectedBarangay] = useState<string>(defaultValue || Barangay.Aclan);
  return (<Fragment>
    <input type="hidden" name={name || 'barangay'} value={selectedBarangay} required={required} />
    <SelectMenu
      title={title || 'Select Barangay'}
      options={BarangayList.map((label) => ({ label, value: label }))}
      selected={selectedBarangay}
      onSelect={(item) => setSelectedBarangay(item.value as string)}
      {...props}
    >
      <Button {...buttonProps} disabled={readOnly}>{selectedBarangay || 'Select barangay...'}</Button>
    </SelectMenu>
  </Fragment>)
}