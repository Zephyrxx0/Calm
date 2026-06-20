declare module "react-calendar-heatmap" {
  import type { FC } from "react";

  interface HeatmapValue {
    date: string;
    [key: string]: any;
  }

  interface CalendarHeatmapProps {
    values: HeatmapValue[];
    startDate?: Date | string;
    endDate?: Date | string;
    classForValue?: (value: HeatmapValue | null) => string;
    titleForValue?: (value: HeatmapValue | null) => string;
    tooltipDataAttrs?: (value: HeatmapValue | null) => Record<string, string>;
    transformDayElement?: (
      element: React.ReactElement<SVGElement>,
      value: HeatmapValue | null,
      index: number
    ) => React.ReactNode;
    showWeekdayLabels?: boolean;
    weekdayLabels?: string[];
    monthLabels?: string[];
    gutterSize?: number;
    horizontal?: boolean;
    onClick?: (value: HeatmapValue | null) => void;
  }

  const CalendarHeatmap: FC<CalendarHeatmapProps>;
  export default CalendarHeatmap;
}
