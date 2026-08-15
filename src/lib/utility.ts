import { useLocation } from "@solidjs/router";
import { DEFAULT_DASHBOARD, DEFAULT_MENU } from "./store";
import { DashboardPath, DataLogSchema, InformationSchema } from "./definition";
import { onCleanup } from "solid-js";

export function dashboardPath(): DashboardPath {
  const location = useLocation();
  const s = location.pathname.split("/");
  const name = s[2] ? s[2] : DEFAULT_DASHBOARD;
  const menu = s[3] ? s[3] : DEFAULT_MENU;
  const submenu = s[4] ? s[4] : "";
  const item = s[5] ? s[5] : "";
  return { name: name, menu: menu, submenu: submenu, item: item };
}

export function replaceHostname(url: string, hostname: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hostname = hostname;
    return urlObj.href;
  } catch (error) {
    console.error(error);
  }
  return url;
}

function zeropad(input: string | number, num: number): string {
  let output: string = String(input);
  for (let i: number = output.length; i < num; i++) {
    output = "0" + output;
  }
  return output;
}

export function dateToString(datetime: Date): string {
  return (
    zeropad(datetime.getFullYear(), 4) + "-" +
    zeropad(datetime.getMonth() + 1, 2) + "-" +
    zeropad(datetime.getDate(), 2) + " " +
    zeropad(datetime.getHours(), 2) + ":" +
    zeropad(datetime.getMinutes(), 2) + ":" +
    zeropad(datetime.getSeconds(), 2)
  );
}

export function stringToDate(timestamp: string): Date {
  const splitDate: string[] = timestamp.split("-");
  const year: number = parseInt(splitDate[0], 10);
  const month: number = parseInt(splitDate[1], 10) - 1; // JS months are 0-indexed
  const date: number = parseInt(splitDate[2].substring(0, 2), 10);

  const splitTime: string[] = timestamp.split(":");
  const hour: number = parseInt(splitTime[0].substring(splitTime[0].length - 2), 10);
  const minute: number = parseInt(splitTime[1], 10);
  const second: number = parseInt(splitTime[2].substring(0, 2), 10);

  return new Date(year, month, date, hour, minute, second);
}

export function rangeName(range: number) {
  if (range < 60000) return String(range / 1000) + " seconds";
  else if(range == 60000) return "1 minute";
  else if(range < 3600000) return String(range / 60000) + " minutes";
  else if(range == 3600000) return "1 hour";
  else if(range < 86400000) return String(range / 3600000) + " hours";
  else if(range == 86400000) return "1 day";
  else return String(range / 86400000) + " day(s)";
}
export function exportToCsv(filename: string, data: object[]): void {
  if (!data || !data.length) return;
  // Extract column headers dynamically from keys
  const headers = Object.keys(data[0]);
  // Format rows and escape quotes/commas properly
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = (row as any)[header] ?? '';
      const stringified = typeof value === 'string' ? value : String(value);
      // Escape inner quotes and wrap text in quotes if commas/quotes exist
      const escaped = stringified.replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
    }).join(',')
  );
  // Combine headers and rows with line breaks
  const csvContent = [headers.join(','), ...csvRows].join('\n');
  // Generate a Blob and trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function clickOutside(el: HTMLElement, accessor: () => () => void) {
  const onClick = (e: MouseEvent) => {
    // If the click happened outside the element, call the function
    if (!el.contains(e.target as Node)) {
      accessor()();
    }
  };
  document.body.addEventListener("click", onClick);
  onCleanup(() => {
    document.body.removeEventListener("click", onClick);
  });
}

export function breadcrumbInformation(s?: InformationSchema) {
  if (!s) return undefined;
  const children1 = [];
  if (Array.isArray(s.children)) {
    for (const item1 of s.children) {
      children1.push({
        name: item1.name,
        text: item1.text
      });
    }
  }
  return {
    name: s.name,
    text: s.text,
    children: children1
  };
}

export function breadcrumbDataLog(s?: DataLogSchema) {
  if (!s) return undefined;
  const children1 = [];
  if (Array.isArray(s.children)) {
    for (const item1 of s.children) {
      let subItems: { name: string; }[] = [];
      if ("devices" in item1 && Array.isArray(item1.devices)) {
        subItems = item1.devices;
      } else if ("sets" in item1 && Array.isArray(item1.sets)) {
        subItems = item1.sets;
      }
      const children2 = [];
      for (const childItem of subItems) {
        children2.push({
          name: childItem.name,
          text: childItem.name
        });
      }
      children1.push({
        name: item1.name,
        text: item1.text,
        children: children2
      });
    }
  }
  return {
    name: s.name,
    text: s.text,
    children: children1
  };
}
