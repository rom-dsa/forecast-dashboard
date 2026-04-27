declare module "react-plotly.js" {
  import { Component } from "react";
  import Plotly from "plotly.js";

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: { data: Plotly.Data[]; layout: Partial<Plotly.Layout> }) => void;
    onUpdate?: (figure: { data: Plotly.Data[]; layout: Partial<Plotly.Layout> }) => void;
  }

  class Plot extends Component<PlotParams> {}
  export default Plot;
}
