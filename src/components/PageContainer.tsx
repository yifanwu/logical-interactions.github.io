import * as React from "react";

import MergedContainer from "./MergedContainer";
import SingleBufferContainer from "./SingleBufferContainer";
import Scatterplot from "./Scatterplot";
import ZoomContainer from "./ZoomContainer";
import CrossfilterContainer from "./CrossfilterContainer";
import { numberArray } from "../lib/stockData";
import { getScatterData, getFlightData } from "../lib/data";

// import { Encoding, Widget, Events } from "../lib/chronicles";

interface PageContainerState {
  bufferSize: number;
  avgDelay: number;
  varDelay: number;
  encoding: string;
  ordered: boolean;
  color: string;
  disabled: boolean;
  policy: string;
  invalidate: boolean;
}

export default class PageContainer extends React.Component<undefined, PageContainerState> {
  m1: MergedContainer;
  m2: MergedContainer;
  mergedContainer: MergedContainer;
  s1: SingleBufferContainer;
  s2: SingleBufferContainer;
  s3: SingleBufferContainer;
  s: SingleBufferContainer;

  constructor() {
    super(undefined);
    this.onChange = this.onChange.bind(this);
    this.state = {
      bufferSize: 4,
      encoding: "COLOR", // "POSITION", //
      avgDelay: 2000,
      varDelay: 1000,
      ordered: true,
      disabled: false,
      color: "BLUE", // "MULTI"
      policy: "blocking",
      invalidate: false,
    };
  }

  onChange(event: any) {
    // hack, if can be coerced into number, coerce into number
    let value = parseInt(event.target.value, 10);
    value = isNaN(value) ? event.target.value : value;
    // should also reset state
    this.setState({ [event.target.name]: value });
  }
  componentDidMount() {
    // FIXME: this is kinda tedious...
    this.m1.updateSelection("Jan");
    this.m2.updateSelection("Jan");
    this.s1.updateSelection("Jan");
    this.s2.updateSelection("Jan");
    this.s3.updateSelection("Jan");
    this.s.updateSelection("Jan");
    this.mergedContainer.updateSelection("Jan");
  }

  // onChange(event: any) {
  //   this.setState({event.target.id, event.target.value});
  // }
  render() {
    let intro = (<div>
      <p>
        Often designers of visual analytic tools (or authoring tools like Tableau) assume that latency is low, and much effort has been put into making computation more efficient.  However it's not always possible to have guaranteed "interactive latency", of less than 500ms.
      </p>
      <p>
        In practice, these interactive speeds are quite challenging to deliver reliably, as the 95th percentile network latency exceeds 300ms for WiFi networks even if data processing time is ignored. This requirement poses a challenge for traditional visualization tools when applied in Cloud and Big Data environments
      </p>
      <p>
        Assuming short latencies causes visualizations to be not only unpleasant to use but often times lead to wrong results. Visualizations break under long latency in different and often opaque ways.
      </p>
      <p>
        Hopefully by the end of this post you will be convinced that one ought to <strong>design with latency in mind</strong>, that there is a simple, clean model to capture these asynchronous behaviors, and that there is a rich design space and many benefits!
      </p>
    </div>);

    let singleBufferControl = (
      <div>
        <p>You can play with different settings here:</p>
        <div className="controls">
          <label htmlFor="policy">Design:  </label>
          <select id="policy" name="policy" className="select" value={this.state.policy} onChange={this.onChange}>
            <option value="blocking">blocking</option>
            <option value="async">async</option>
            <option value="newest">newest</option>
          </select>
          <label htmlFor="invalidate">  invalidate:  </label>
          <select id="invalidate" name="invalidate" className="select" value={this.state.invalidate.toString()} onChange={this.onChange}>
          <option value="true">true</option>
          <option value="false">false</option>
          </select>
        </div>
      </div>
    );
    let singleBufferVis = (<SingleBufferContainer
      ref={c => this.s = c}
      policy={this.state.policy}
      invalidate={this.state.invalidate}
    />);
    let singleBuffer = (<div>
      <p>
        To start getting a sense of what it means to design with latency in mind.  Let's first take a look at a simple, <strong>blocking</strong> design that's often used in practice, for instance, in Tableau. The blocking interface prevents you from performing another interaction, if the previous interaction has not loaded.
      </p>
    <SingleBufferContainer
      ref={c => this.s1 = c}
      policy={"blocking"}
      invalidate={false}
    />
    <p>
      This blocking design could be annoying if you no longer want to see the result that is being requested.  The following design allows you to intervene, and see only the most recent result.
    </p>
    <SingleBufferContainer
      ref={c => this.s2 = c}
      policy={"newest"}
      invalidate={false}
    />
    <p>
      So this "non-blocking" interface is perhaps a bit better as it allows you to intervene whenever you please.  However it still is subpar because you can only see one result at a time.  What if I just want to see all of the results as fast as possible?  To understand what this means, consider the following events diagram of a series of asynchronous calls:
    </p>
    <p>
      Our initial hypothesis is that perhaps people can still make sense of results out of order, if the task is simple enough, such as seeing if a month's value crossed a line. Perhaps you can give it a try.
    </p>
    <SingleBufferContainer
      ref={c => this.s3 = c}
      policy={"async"}
      invalidate={false}
    />
    <p>
      We found, through an experiment on Mechanical Turk, that people were very reluctant to experience the results arriving randomly---they just waited for the previous result to arrive.  Which got us thinking... Can there be anything that helps?
    </p>
    {singleBufferControl}
    {singleBufferVis}
    </div>
    );
    let control = (
      <div className="controls">
        <label htmlFor="encoding">Design:  </label>
        <select id="encoding" name="encoding" className="select" value={this.state.encoding} onChange={this.onChange}>
          <option value="POSITION">Multiples</option>
          <option value="COLOR">Overlay</option>
        </select>
        <label htmlFor="encoding">  Buffer Size:  </label>
        <select id="bufferSize" name="bufferSize" className="select" value={this.state.bufferSize.toString()} onChange={this.onChange}>
          <option value="1">1</option>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </select>
        <select id="ordered" name="ordered" className="select" value={this.state.ordered.toString()} onChange={this.onChange}>
        <option value="true">ordered</option>
        <option value="false">unordered</option>
        </select>
      </div>
    );
    let vis = (
      <MergedContainer
        ref={c => this.mergedContainer = c}
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        disabled={this.state.disabled}
      />);

    let chronicles = (<div>
      <p>
        Which is what brought us to think, what if all the results you ever see will always be on the screeen (that it's <strong>stable</strong>)? It brings the following design you see, go ahead and play with the visualization.
      </p>
      <MergedContainer
        ref={c => this.m1 = c}
        bufferSize={20}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"MULTIPLES"}
        ordered={false}
        color={this.state.color}
        disabled={this.state.disabled}
      />
      <p>
        Like you hopefully have discovered (let us know if you didn't!), you didn't wait for each individual result to load, but rather interacted in parallel.  This can fit into any tasks that do not require strict order, like finding the maximum value of a month across the years, or finding out liers.
      </p>
      <p>
        It turns out that this effect persists even if you dont get to see all the results --- we limited the total number of of the results you can see and ran some experiments with mechanical turk users.
      </p>
      <MergedContainer
        ref={c => this.m2 = c}
        bufferSize={20}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"MULTIPLES"}
        ordered={false}
        color={this.state.color}
        disabled={this.state.disabled}
      />
      <p>
        It turns out that there is a lot you can play around with, like how to compose the multiple resulting charts, how many past results to show, whether to order the color encodings, and so on.  For a different example in the design space, see below.  You can also play with the settings in the control bar.
      </p>
      {control}
      {vis}
      <p>
        We speculate that different corners in the design space will have different tradeoffs and should be adapted to different kinds of visualizations and tasks.  However a more pressing question on your mind at this point is probably how generalizable this design is.  We hope the following examples could illustrate how to generalize the idea---just visualize short term history and the correspondence between interaction and the corresponding results!
      </p>
    </div>);
    let moreDesignsScatter = (<p>
      Asynchronous designs could be applied to other scenarios that doesn't seem "parallelizable" immediately. See the following example of zooming on a scatter plot.  Everytime you interact, the corresponding interaction shows up immediately, with a small legend that is your actual interaction, so you know that your interaction is acknowledged and remind you of what the result is actually for.
    </p>);
    let scatterData = getScatterData(numberArray);
    let scatter = (
      <ZoomContainer
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        dataset={scatterData}
      />
    );
    let moreDesignsCrossfilter = (<p>
      Here is an example of crossfilter using chronicles.  Use the top row, light green colored visualizations to interact (the generated charts cannot be interacted with).  The small black bar on the bottom indicates the specification of the brush that was used to filter the value.  As you interact, new data will be appended, in reverse order.  Crossfilter is a fairly complex interaction, but you see the "chronicled" version isn't so bad!
    </p>);
    let crossfilterData = getFlightData();
    let crossfilter = (
      <CrossfilterContainer
        dataset={crossfilterData}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
      />
    );
    let implementation = (<p>
      These designs are none trivial to implement, and require a "time-centric" way to treat the application.  We will talk about that in another article.
    </p>);
    return (
      <div>
        {intro}
        {singleBuffer}
        {chronicles}
        {moreDesignsScatter}
        {scatter}
        {moreDesignsCrossfilter}
        {crossfilter}
      </div>
    );
  }
}