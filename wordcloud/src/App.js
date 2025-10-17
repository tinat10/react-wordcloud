import React, { Component } from "react";
import "./App.css";
import * as d3 from "d3";

// --- Layout + sizing ---
const DIMS = {
  width: 1000,
  height: 420,
  margin: { top: 28, right: 40, bottom: 40, left: 40 },
};

// --- Helpers to keep words in-bounds ---
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const estimateHalfWidth = (word, sizePx) => 0.3 * sizePx * word.length; 
const estimateHalfHeight = (sizePx) => 0.5 * sizePx;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { wordFrequency: [] };
    this.hasRenderedOnce = false;
  }

  componentDidMount() {
    this.renderChart();
  }
  componentDidUpdate() {
    this.renderChart();
  }

  getWordFrequency = (text) => {
    const stopWords = new Set([
      "the","and","a","an","in","on","at","for","with","about","as","by","to","of","from","that",
      "which","who","whom","this","these","those","it","its","they","their","them","we","our","ours",
      "you","your","yours","he","him","his","she","her","hers","us","theirs","i","me","my","myself",
      "yourself","yourselves","was","were","is","am","are","be","been","being","have","has","had",
      "having","do","does","did","doing","as","if","each","how","what","without","through","over",
      "under","above","below","between","among","during","before","after","until","while","off","out",
      "into","against","amongst","throughout","despite","towards","upon","isn't","aren't","wasn't",
      "weren't","haven't","hasn't","hadn't","doesn't","didn't","don't","won't","wouldn't","can't",
      "couldn't","shouldn't","mustn't","needn't","daren't"
    ]);
    const words = text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=_`~()"]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);

    const filtered = words.filter((w) => !stopWords.has(w));
    const freqObj = filtered.reduce((acc, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(freqObj); 
  };

  renderChart() {
    const data = this.state.wordFrequency
      .slice()
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); 
    const svg = d3
      .select(".svg_parent")
      .attr("width", DIMS.width)
      .attr("height", DIMS.height)
      .attr("viewBox", `0 0 ${DIMS.width} ${DIMS.height}`);

    const g = svg.selectAll("g.main").data([null]);
    const gEnter = g.enter().append("g").attr("class", "main");
    const main = gEnter.merge(g);

    if (!data.length) {
      main.selectAll("text.word").remove();
      return;
    }

    const counts = data.map((d) => d[1]);
    const minC = Math.max(1, d3.min(counts) ?? 1);
    const maxC = Math.max(minC, d3.max(counts) ?? 1);

    const fontSize = d3.scaleLinear().domain([minC, maxC]).range([22, 56]);

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(1, data.length - 1)])
      .range([DIMS.margin.left, DIMS.width - DIMS.margin.right]);

    const y = d3
      .scaleLinear()
      .domain([minC, maxC])
      .range([DIMS.height - DIMS.margin.bottom, DIMS.margin.top]);

    // Clamp positions using estimated text bounds
    const safeX = (d) => {
      const size = fontSize(d.count);
      const halfW = estimateHalfWidth(d.word, size);
      const minX = DIMS.margin.left + halfW;
      const maxX = DIMS.width - DIMS.margin.right - halfW;
      return clamp(x(d.rank), minX, maxX);
    };
    const safeY = (d) => {
      const size = fontSize(d.count);
      const halfH = estimateHalfHeight(size);
      const minY = DIMS.margin.top + halfH;
      const maxY = DIMS.height - DIMS.margin.bottom - halfH;
      return clamp(y(d.count), minY, maxY);
    };

    const joined = main
      .selectAll("text.word")
      .data(
        data.map(([word, count], i) => ({ word, count, rank: i })),
        (d) => d.word
      );

    joined
      .exit()
      .transition()
      .duration(400)
      .style("opacity", 0)
      .remove();

    const entered = joined
      .enter()
      .append("text")
      .attr("class", "word")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("x", (d) => safeX(d))
      .attr("y", (d) => safeY(d))
      .style("opacity", 0.9)
      .text((d) => d.word);

    if (!this.hasRenderedOnce) {

      entered
        .style("font-size", 1)
        .transition()
        .duration(900)
        .style("font-size", (d) => `${fontSize(d.count)}px`);

      d3.timeout(() => {
        this.hasRenderedOnce = true;
      }, 950);
    } else {

      entered.style("font-size", (d) => `${fontSize(d.count)}px`);

      joined
        .merge(entered)
        .transition()
        .duration(900)
        .attr("x", (d) => safeX(d))
        .attr("y", (d) => safeY(d))
        .style("font-size", (d) => `${fontSize(d.count)}px`);
    }
  }

  render() {
    return (
      <div className="parent">
        <div className="child1" style={{ width: 1000 }}>
          <textarea
            type="text"
            id="input_field"
            style={{ height: 150, width: 1000 }}
          />
          <button
            type="submit"
            value="Generate Matrix"
            style={{ marginTop: 10, height: 40, width: 1000 }}
            onClick={() => {
              const input_data =
                document.getElementById("input_field").value || "";
              this.setState({
                wordFrequency: this.getWordFrequency(input_data),
              });
            }}
          >
            Generate WordCloud
          </button>
        </div>
        <div className="child2">
          <svg className="svg_parent"></svg>
        </div>
      </div>
    );
  }
}

export default App;
