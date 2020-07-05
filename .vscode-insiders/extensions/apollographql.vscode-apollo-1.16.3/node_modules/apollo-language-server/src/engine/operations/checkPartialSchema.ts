import gql from "graphql-tag";

export const CHECK_PARTIAL_SCHEMA = gql`
  mutation CheckPartialSchema(
    $id: ID!
    $graphVariant: String!
    $implementingServiceName: String!
    $partialSchema: PartialSchemaInput!
    $gitContext: GitContextInput
    $historicParameters: HistoricQueryParameters
  ) {
    service(id: $id) {
      checkPartialSchema(
        graphVariant: $graphVariant
        implementingServiceName: $implementingServiceName
        partialSchema: $partialSchema
        gitContext: $gitContext
        historicParameters: $historicParameters
      ) {
        compositionValidationResult {
          compositionValidationDetails {
            schemaHash
          }
          graphCompositionID
          errors {
            message
          }
        }
        checkSchemaResult {
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
          targetUrl
        }
      }
    }
  }
`;
