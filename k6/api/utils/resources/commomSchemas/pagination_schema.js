export const pagination_schema = {
    type: "object",
    required: [
      "pageNumber",
      "pageSize",
      "maxPageSize",
      "totalPages",
      "totalElements",
    ],
    properties: {
      pageNumber: {
        type: "number",
        minimum: 1,
      },
      pageSize: {
        type: "number",
        minimum: 0,
      },
      maxPageSize: {
        type: "number",
        minimum: 1,
      },
      totalPages: {
        type: "number",
        minimum: 0,
      },
      totalElements: {
        type: "number",
        minimum: 0,
      },
    },
  };
  
  export default {
    pagination_schema,
  };