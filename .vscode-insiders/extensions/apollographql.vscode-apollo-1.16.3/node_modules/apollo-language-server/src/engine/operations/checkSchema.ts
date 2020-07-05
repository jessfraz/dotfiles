import gql from "graphql-tag";

export const CHECK_SCHEMA = gql`
  mutation CheckSchema(
    $id: ID!
    $schema: IntrospectionSchemaInput
    $schemaHash: String
    $tag: String
    $gitContext: GitContextInput
    $historicParameters: HistoricQueryParameters
  ) {
    service(id: $id) {
      checkSchema(
        proposedSchema: $schema
        proposedSchemaHash: $schemaHash
        baseSchemaTag: $tag
        gitContext: $gitContext
        historicParameters: $historicParameters
      ) {
        targetUrl
        diffToPrevious {
          severity
          affectedClients {
            __typename
          }
          affectedQueries {
            __typename
          }
          numberOfCheckedOperations
          changes {
            severity
            code
            description
          }
          validationConfig {
            from
            to
            queryCountThreshold
            queryCountThresholdPercentage
          }
        }
      }
    }
  }
`;
