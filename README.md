# volcanoes-mcp
MCP server for Smithsonian Global Volcanism Program

[![smithery badge](https://smithery.ai/badge/@blake365/volcanoes-mcp)](https://smithery.ai/server/@blake365/volcanoes-mcp)

<a href="https://glama.ai/mcp/servers/v67anfiq0s">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/v67anfiq0s/badge" alt="Volcanoes Server MCP server" />
</a>

An MCP server implementation for providing access to the [Smithsonian Global Volcanism Program](https://volcano.si.edu) within [Claude Desktop](https://claude.ai/download).

## Overview

This Model Context Protocol (MCP) server enables AI assistants and applications to:

- Query comprehensive geologic data and information provided by the Smithsonian Global Volcanism Program
- Access volcano profiles, eruption records, and volcanic activity
- Analyze volcanic data to improve understanding of volcanic activity
- Create graphics and perform data analysis from the data

Users can run queries using natural language.

## Sample Output

**Q. Get information on the Buzzard Creek volcano in Alaska**

A. 
I'll look up information about the Buzzard Creek volcano in Alaska for you.

get-volcano-details
```json
{
  "verbose": true,
  "volcano_name": "Buzzard Creek",
}
```

Here's detailed information about Buzzard Creek volcano in Alaska:

## Basic Information
Buzzard Creek is a small volcanic feature located in central Alaska, near the town of Healy along the Parks Highway. It sits at coordinates 64.0616°N, 148.4327°W at an elevation of 830 meters (2,723 feet).

## Volcanic Features
The volcano consists of two Holocene tuff rings that formed craters:

- Larger crater: 300 meters wide
- Smaller crater: 66 meters wide, located about 200 meters southeast of the larger one
- Both craters contain small lakes
- The craters were formed by phreatomagmatic eruptions (explosive interactions between magma and groundwater)

## Eruption History

- Last eruption: Approximately 3,000 years ago (around 1050 BCE)
- Volcanic Explosivity Index (VEI): 2
- The eruption was relatively minor, with a total ejecta volume probably not exceeding 0.001 cubic kilometers
- Most of the ejecta consists of accessory material (pre-existing rock fragments)

## Geological Context
Buzzard Creek has several notable characteristics:

- Rock type: Basalt/Picro-Basalt
- Tectonic setting: Located over a subduction zone with continental crust
- Unusual location: Sits 320 km northeast of its nearest Holocene volcanic neighbor (Hayes volcano), making it quite isolated from the main Aleutian volcanic arc
- Geological position: Located directly over the northernmost corner of the subducting Pacific Plate

## Historical Context
The ejecta from the eruptions overlies young glacial terraces that correlate with a glacial stage that ended about 10,000 years ago, helping scientists date the volcanic activity through radiocarbon dating methods.

Buzzard Creek represents a minor but geologically interesting volcanic feature that demonstrates how volcanic activity can occur in unexpected locations, even far from the main volcanic chains.

## Installation

### Installing via Smithery

To install Smithsonian Global Volcanism Program Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@blake365/volcanoes-mcp):

```bash
npx -y @smithery/cli install @blake365/volcanoes-mcp --client claude
```

### Extra Steps

If you want to make changes to the server you can do so by editing the `src/index.ts` file.
- Run `npm install` to install dependencies
- Run `npm run build` to build the server
- Quit and restart Claude Desktop after making changes


## Connecting with Claude Desktop

1. Open your Claude Desktop configuration at:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:
```json
{
    "mcpServers": {
        "volcanoes": {
            "command": "node",
            "args": [
                "/Full/Route/to/Folder/volcanoes-mcp/build/index.js"
            ]
        }
    }
}
```

3. Close/Quit then restart Claude Desktop

Once you restart you should see an icon for search and tools. Click this button to see the MCP tools available.

## Troubleshooting

If you get errors when running the server you may need to provide the full path to the `node` command. For example, on macOS: `/usr/local/bin/node`