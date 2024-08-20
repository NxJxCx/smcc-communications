export default function CardContainer({
  title,
  children,
}: {
  title?: string|JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-sm shadow p-4 min-w-[250px]">
      <div className="rounded-t bg-emerald-700 border border-emerald-700 text-green-50 font-semibold p-3">{title}</div>
      <div className="text-gray-600 text-sm py-4 p-3 border border-emerald-700 rounded-b">
        {children}
      </div>
    </div>
  )
}