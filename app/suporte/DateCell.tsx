import { useEffect, useState } from "react";

interface DateCellProps {
  date: string | number | Date;
}

export default function DateCell({ date }: DateCellProps) {
  const [formatted, setFormatted] = useState("");
  useEffect(() => {
    setFormatted(new Date(date).toLocaleDateString());
  }, [date]);
  return <>{formatted}</>;
}