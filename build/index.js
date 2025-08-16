import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListToolsRequestSchema, ListRootsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
const server = new Server({ name: "volcanoes", version: "1.0.0" }, {
    capabilities: {
        tools: {},
        prompts: {},
        roots: {},
        resources: {},
    },
});
const BASE_WFS_URL = "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/wfs";
const API_SCHEMAS = {
    eruption_response: {
        type: "object",
        properties: {
            type: { type: "string", enum: ["FeatureCollection"] },
            features: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: { type: "string", enum: ["Feature"] },
                        geometry: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["Point"] },
                                coordinates: {
                                    type: "array",
                                    items: { type: "number" },
                                    minItems: 2,
                                    maxItems: 2
                                }
                            }
                        },
                        properties: {
                            type: "object",
                            properties: {
                                Volcano_Number: { type: "number" },
                                Volcano_Name: { type: "string" },
                                Eruption_Number: { type: "number" },
                                Activity_Type: { type: "string" },
                                ExplosivityIndexMax: { type: ["number", "null"] },
                                ActivityArea: { type: ["string", "null"] },
                                StartDateYear: { type: ["number", "null"] },
                                EndDateYear: { type: ["number", "null"] },
                                StartEvidenceMethod: { type: ["string", "null"] }
                            }
                        }
                    }
                }
            }
        }
    },
    volcano_response: {
        type: "object",
        properties: {
            type: { type: "string", enum: ["FeatureCollection"] },
            features: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: { type: "string", enum: ["Feature"] },
                        geometry: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["Point"] },
                                coordinates: {
                                    type: "array",
                                    items: { type: "number" },
                                    minItems: 2,
                                    maxItems: 2
                                }
                            }
                        },
                        properties: {
                            type: "object",
                            properties: {
                                VolcanoNumber: { type: "number" },
                                VolcanoName: { type: "string" },
                                Country: { type: "string" },
                                VolcanoType: { type: ["string", "null"] },
                                LastEruption: { type: ["number", "string", "null"] },
                                Elevation: { type: ["number", "null"] },
                                TectonicSetting: { type: ["string", "null"] },
                                Within_5km: { type: ["number", "null"] },
                                Within_10km: { type: ["number", "null"] },
                                Within_30km: { type: ["number", "null"] },
                                Within_100km: { type: ["number", "null"] },
                                LatitudeDecimal: { type: "number" },
                                LongitudeDecimal: { type: "number" }
                            }
                        }
                    }
                }
            }
        }
    }
};
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [
        {
            uri: "schema://eruption_response",
            name: "Eruption Data Schema",
            description: "Schema for volcanic eruption data returned by the Smithsonian GVP WFS API",
            mimeType: "application/schema+json",
        },
        {
            uri: "schema://volcano_response",
            name: "Volcano Data Schema",
            description: "Schema for volcano profile data returned by the Smithsonian GVP WFS API",
            mimeType: "application/schema+json",
        },
    ];
    return { resources };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const schemaKey = request.params.uri.replace("schema://", "");
    const schema = API_SCHEMAS[schemaKey];
    if (!schema)
        throw new Error(`Unknown schema: ${request.params.uri}`);
    return {
        contents: [
            {
                uri: request.params.uri,
                mimeType: "application/schema+json",
                text: JSON.stringify(schema, null, 2),
            },
        ],
    };
});
const ROOTS = [
// {
// 	type: "geographic" as const,
// 	uri: "geo:///north-america",
// 	name: "North America",
// 	bounds: {
// 		north: 90,
// 		south: 15,
// 		east: -50,
// 		west: -170,
// 	},
// },
// {
// 	type: "geographic" as const,
// 	uri: "geo:///united-states",
// 	name: "United States",
// 	bounds: {
// 		north: 49,
// 		south: 25,
// 		east: -66,
// 		west: -125,
// 	},
// },
];
server.setRequestHandler(ListRootsRequestSchema, async () => {
    return {
        roots: ROOTS,
    };
});
const PROMPTS = {
    "recent-activity": {
        name: "recent-activity",
        description: "Find recent volcanic activity and eruptions worldwide",
        arguments: [
            {
                name: "years_back",
                description: "Number of years to look back (default: 5)",
                required: false,
            },
            {
                name: "min_vei",
                description: "Minimum VEI (Volcanic Explosivity Index) to include",
                required: false,
            },
        ],
    },
    "risk-assessment": {
        name: "risk-assessment",
        description: "Analyze volcanic risk for populated areas",
        arguments: [
            {
                name: "country",
                description: "Country or region to assess",
                required: false,
            },
            {
                name: "min_population",
                description: "Minimum population within 30km to consider high-risk",
                required: false,
            },
        ],
    },
    "volcano-profile": {
        name: "volcano-profile",
        description: "Get detailed profile and eruption history for a specific volcano",
        arguments: [
            {
                name: "volcano_name",
                description: "Name of the volcano to analyze",
                required: true,
            },
        ],
    },
};
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: Object.values(PROMPTS),
    };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS[request.params.name];
    if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
    }
    if (request.params.name === "recent-activity") {
        const years_back = request.params.arguments?.years_back || 5;
        const min_vei = request.params.arguments?.min_vei || 0;
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Find recent volcanic eruptions from the last ${years_back} years with VEI ${min_vei} or higher. Include volcano names, locations, dates, and intensity information. Highlight any ongoing eruptions and analyze patterns by region.`,
                    },
                },
            ],
        };
    }
    if (request.params.name === "risk-assessment") {
        const country = request.params.arguments?.country || "worldwide";
        const min_population = request.params.arguments?.min_population || 10000;
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Analyze volcanic risk in ${country}. Find volcanoes with recent activity (last 100 years) that have populations of ${min_population}+ within 30km. Include volcano types, last eruption dates, VEI history, and population exposure. Prioritize by risk level.`,
                    },
                },
            ],
        };
    }
    if (request.params.name === "volcano-profile") {
        const volcano_name = request.params.arguments?.volcano_name;
        if (!volcano_name) {
            throw new Error("volcano_name argument is required for volcano-profile prompt");
        }
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Create a comprehensive profile for ${volcano_name}. Include: volcano characteristics (type, elevation, location), eruption history with dates and VEI, population at risk, tectonic setting, and recent activity. Compare with similar volcanoes in the region.`,
                    },
                },
            ],
        };
    }
    return {};
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search-volcanoes",
                description: "Search for volcanoes by location, country, or characteristics. Returns volcano profiles with details like type, elevation, last eruption, and population exposure.",
                inputSchema: {
                    type: "object",
                    properties: {
                        country: {
                            type: "string",
                            description: "Country name (e.g., 'Japan', 'Indonesia', 'United States')",
                        },
                        volcano_type: {
                            type: "string",
                            description: "Type of volcano (e.g., 'Stratovolcano', 'Shield volcano', 'Caldera')",
                        },
                        min_elevation: {
                            type: "number",
                            description: "Minimum elevation in meters",
                        },
                        max_elevation: {
                            type: "number",
                            description: "Maximum elevation in meters",
                        },
                        bbox: {
                            type: "string",
                            description: "Geographic bounding box as 'west,south,east,north' (e.g., '129,30,146,46' for Japan region)",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of results to return (default: 50)",
                        },
                        verbose: {
                            type: "boolean",
                            description: "Include detailed geological summaries, photo captions, and photo credits (default: false)",
                        },
                    },
                },
            },
            {
                name: "search-eruptions",
                description: "Search volcanic eruptions by date range, volcano, intensity (VEI), or location. Returns eruption records with dates, explosivity, and activity details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        volcano_name: {
                            type: "string",
                            description: "Name of specific volcano to search",
                        },
                        start_year: {
                            type: "number",
                            description: "Start year for eruption search (negative for BCE, e.g., -1000 for 1000 BCE)",
                        },
                        end_year: {
                            type: "number",
                            description: "End year for eruption search",
                        },
                        min_vei: {
                            type: "number",
                            description: "Minimum Volcanic Explosivity Index (0-8, higher = more explosive)",
                        },
                        country: {
                            type: "string",
                            description: "Country name to filter eruptions",
                        },
                        bbox: {
                            type: "string",
                            description: "Geographic bounding box as 'west,south,east,north'",
                        },
                        ongoing_only: {
                            type: "boolean",
                            description: "Only return eruptions that may still be ongoing (no end date)",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of results to return (default: 50)",
                        },
                        verbose: {
                            type: "boolean",
                            description: "Include detailed geological summaries, photo captions, and photo credits (default: false)",
                        },
                    },
                },
            },
            {
                name: "find-recent-activity",
                description: "Find recent volcanic activity and eruptions. Useful for monitoring current volcanic threats and recent changes in volcanic behavior.",
                inputSchema: {
                    type: "object",
                    properties: {
                        years_back: {
                            type: "number",
                            description: "Number of years to look back from present (default: 10)",
                        },
                        min_vei: {
                            type: "number",
                            description: "Minimum VEI to include (default: 0)",
                        },
                        country: {
                            type: "string",
                            description: "Limit to specific country",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of results (default: 100)",
                        },
                        verbose: {
                            type: "boolean",
                            description: "Include detailed geological summaries, photo captions, and photo credits (default: false)",
                        },
                    },
                },
            },
            {
                name: "assess-volcanic-risk",
                description: "Assess volcanic risk by finding volcanoes near populated areas. Identifies high-risk volcanoes based on population exposure and eruption history.",
                inputSchema: {
                    type: "object",
                    properties: {
                        country: {
                            type: "string",
                            description: "Country to assess (optional, defaults to worldwide)",
                        },
                        min_population_5km: {
                            type: "number",
                            description: "Minimum population within 5km to consider high-risk",
                        },
                        min_population_30km: {
                            type: "number",
                            description: "Minimum population within 30km to consider moderate-risk",
                        },
                        recent_activity_years: {
                            type: "number",
                            description: "Years to look back for recent activity (default: 200)",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of volcanoes to return (default: 50)",
                        },
                        verbose: {
                            type: "boolean",
                            description: "Include detailed geological summaries, photo captions, and photo credits (default: false)",
                        },
                    },
                },
            },
            {
                name: "get-volcano-details",
                description: "Get detailed information about a specific volcano, including its characteristics, eruption history, and risk profile.",
                inputSchema: {
                    type: "object",
                    properties: {
                        volcano_name: {
                            type: "string",
                            description: "Name of the volcano (e.g., 'Mount Fuji', 'Kilauea', 'Vesuvius')",
                        },
                        include_eruptions: {
                            type: "boolean",
                            description: "Include eruption history (default: true)",
                        },
                        eruption_limit: {
                            type: "number",
                            description: "Maximum number of eruptions to return (default: 20)",
                        },
                        verbose: {
                            type: "boolean",
                            description: "Include detailed geological summaries, photo captions, and photo credits (default: false)",
                        },
                    },
                    required: ["volcano_name"],
                },
            },
            {
                name: "find-large-eruptions",
                description: "Find historically significant large volcanic eruptions. Useful for studying major volcanic events and their impacts.",
                inputSchema: {
                    type: "object",
                    properties: {
                        min_vei: {
                            type: "number",
                            description: "Minimum VEI level (4+ for large eruptions, 6+ for colossal, default: 4)",
                        },
                        start_year: {
                            type: "number",
                            description: "Start year to search from (negative for BCE)",
                        },
                        end_year: {
                            type: "number",
                            description: "End year to search to",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of eruptions to return (default: 50)",
                        },
                        verbose: {
                            type: "boolean",
                            description: "Include detailed geological summaries, photo captions, and photo credits (default: false)",
                        },
                    },
                },
            },
        ],
    };
});
async function buildWFSQuery(layer, filters, limit = 50) {
    const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeName: layer,
        outputFormat: "application/json",
        count: limit.toString(),
    });
    if (filters.length > 0) {
        params.set("CQL_FILTER", filters.join(" AND "));
    }
    return `${BASE_WFS_URL}?${params}`;
}
function cleanResponse(data, verbose = false) {
    if (!data || !data.features)
        return data;
    return {
        ...data,
        features: data.features.map((feature) => {
            const cleanFeature = {
                type: feature.type,
                geometry: feature.geometry,
                properties: { ...feature.properties }
            };
            // Always remove duplicate and modifier fields
            delete cleanFeature.properties.Volcanic_Landform; // Duplicate of Primary_Volcano_Type
            delete cleanFeature.properties.StartDateYearModifier;
            delete cleanFeature.properties.StartDateYearUncertainty;
            delete cleanFeature.properties.StartDateDayModifier;
            delete cleanFeature.properties.StartDateDayUncertainty;
            delete cleanFeature.properties.EndDateYearModifier;
            delete cleanFeature.properties.EndDateYearUncertainty;
            delete cleanFeature.properties.EndDateDayModifier;
            delete cleanFeature.properties.EndDateDayUncertainty;
            delete cleanFeature.properties.ExplosivityIndexModifier;
            // Remove verbose fields only if not in verbose mode
            if (!verbose) {
                delete cleanFeature.properties.Primary_Photo_Link;
                delete cleanFeature.properties.Primary_Photo_Caption;
                delete cleanFeature.properties.Primary_Photo_Credit;
                delete cleanFeature.properties.Geological_Summary;
            }
            return cleanFeature;
        }),
        // Keep essential metadata
        totalFeatures: data.totalFeatures,
        numberReturned: data.numberReturned
    };
}
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    let data;
    try {
        if (request.params.name === "search-volcanoes") {
            const args = request.params.arguments;
            const filters = [];
            if (args.country) {
                filters.push(`Country LIKE '%${args.country}%'`);
            }
            if (args.volcano_type) {
                filters.push(`VolcanoType = '${args.volcano_type}'`);
            }
            if (args.min_elevation) {
                filters.push(`Elevation >= ${args.min_elevation}`);
            }
            if (args.max_elevation) {
                filters.push(`Elevation <= ${args.max_elevation}`);
            }
            const url = await buildWFSQuery("Smithsonian_VOTW_Holocene_Volcanoes", filters, args.limit || 50);
            if (args.bbox) {
                const bboxUrl = url + `&bbox=${args.bbox}`;
                const response = await fetch(bboxUrl);
                data = cleanResponse(await response.json(), args.verbose);
            }
            else {
                const response = await fetch(url);
                data = cleanResponse(await response.json(), args.verbose);
            }
        }
        else if (request.params.name === "search-eruptions") {
            const args = request.params.arguments;
            const filters = [];
            if (args.volcano_name) {
                filters.push(`Volcano_Name LIKE '%${args.volcano_name}%'`);
            }
            if (args.start_year) {
                filters.push(`StartDateYear >= ${args.start_year}`);
            }
            if (args.end_year) {
                filters.push(`StartDateYear <= ${args.end_year}`);
            }
            if (args.min_vei !== undefined) {
                filters.push(`ExplosivityIndexMax >= ${args.min_vei}`);
            }
            if (args.country) {
                filters.push(`Volcano_Name IN (SELECT Volcano_Name FROM Smithsonian_VOTW_Holocene_Volcanoes WHERE Country LIKE '%${args.country}%')`);
            }
            if (args.ongoing_only) {
                filters.push(`EndDateYear IS NULL`);
            }
            const url = await buildWFSQuery("Smithsonian_VOTW_Holocene_Eruptions", filters, args.limit || 50);
            if (args.bbox) {
                const bboxUrl = url + `&bbox=${args.bbox}`;
                const response = await fetch(bboxUrl);
                data = cleanResponse(await response.json(), args.verbose);
            }
            else {
                const response = await fetch(url);
                data = cleanResponse(await response.json(), args.verbose);
            }
        }
        else if (request.params.name === "find-recent-activity") {
            const args = request.params.arguments;
            const currentYear = new Date().getFullYear();
            const yearsBack = args.years_back || 10;
            const startYear = currentYear - yearsBack;
            const filters = [`StartDateYear >= ${startYear}`];
            if (args.min_vei !== undefined) {
                filters.push(`ExplosivityIndexMax >= ${args.min_vei}`);
            }
            if (args.country) {
                filters.push(`Volcano_Name IN (SELECT Volcano_Name FROM Smithsonian_VOTW_Holocene_Volcanoes WHERE Country LIKE '%${args.country}%')`);
            }
            const url = await buildWFSQuery("Smithsonian_VOTW_Holocene_Eruptions", filters, args.limit || 100);
            const response = await fetch(url);
            data = cleanResponse(await response.json(), args.verbose);
        }
        else if (request.params.name === "assess-volcanic-risk") {
            const args = request.params.arguments;
            const recentYears = args.recent_activity_years || 200;
            const currentYear = new Date().getFullYear();
            const cutoffYear = currentYear - recentYears;
            const filters = [`LastEruption >= ${cutoffYear}`];
            if (args.country) {
                filters.push(`Country LIKE '%${args.country}%'`);
            }
            if (args.min_population_5km) {
                filters.push(`Within_5km >= ${args.min_population_5km}`);
            }
            if (args.min_population_30km) {
                filters.push(`Within_30km >= ${args.min_population_30km}`);
            }
            const url = await buildWFSQuery("Smithsonian_VOTW_Holocene_Volcanoes", filters, args.limit || 50);
            const response = await fetch(url);
            data = cleanResponse(await response.json(), args.verbose);
        }
        else if (request.params.name === "get-volcano-details") {
            const args = request.params.arguments;
            const volcanoName = args.volcano_name;
            // First get volcano profile
            const volcanoFilters = [`VolcanoName LIKE '%${volcanoName}%'`];
            const volcanoUrl = await buildWFSQuery("Smithsonian_VOTW_Holocene_Volcanoes", volcanoFilters, 10);
            const volcanoResponse = await fetch(volcanoUrl);
            const volcanoData = cleanResponse(await volcanoResponse.json(), args.verbose);
            if (args.include_eruptions !== false) {
                // Then get eruption history
                const eruptionFilters = [`Volcano_Name LIKE '%${volcanoName}%'`];
                const eruptionUrl = await buildWFSQuery("Smithsonian_VOTW_Holocene_Eruptions", eruptionFilters, args.eruption_limit || 20);
                const eruptionResponse = await fetch(eruptionUrl);
                const eruptionData = cleanResponse(await eruptionResponse.json(), args.verbose);
                data = {
                    volcano_profile: volcanoData,
                    eruption_history: eruptionData,
                };
            }
            else {
                data = volcanoData;
            }
        }
        else if (request.params.name === "find-large-eruptions") {
            const args = request.params.arguments;
            const filters = [`ExplosivityIndexMax >= ${args.min_vei || 4}`];
            if (args.start_year) {
                filters.push(`StartDateYear >= ${args.start_year}`);
            }
            if (args.end_year) {
                filters.push(`StartDateYear <= ${args.end_year}`);
            }
            const url = await buildWFSQuery("Smithsonian_VOTW_Holocene_Eruptions", filters, args.limit || 50);
            const response = await fetch(url);
            data = cleanResponse(await response.json(), args.verbose);
        }
        else {
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
        return {
            content: [
                { type: "text", text: JSON.stringify(data, null, 2) },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
                },
            ],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
});
