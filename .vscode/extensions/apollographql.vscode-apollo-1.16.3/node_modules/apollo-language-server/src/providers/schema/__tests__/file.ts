import { FileSchemaProvider } from "../file";
import * as path from "path";
import * as fs from "fs";
import { Debug } from "../../../utilities";
import { isDone } from "nock";

const makeNestedDir = dir => {
  if (fs.existsSync(dir)) return;

  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code == "ENOENT") {
      makeNestedDir(path.dirname(dir)); //create parent dir
      makeNestedDir(dir); //create dir
    }
  }
};

const deleteFolderRecursive = path => {
  // don't delete files on windows -- will get a resource locked error
  if (
    require("os")
      .type()
      .includes("Windows")
  )
    return;

  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const writeFilesToDir = (dir: string, files: Record<string, string>) => {
  Object.keys(files).forEach(key => {
    if (key.includes("/")) makeNestedDir(path.dirname(key));
    fs.writeFileSync(`${dir}/${key}`, files[key]);
  });
};

describe("FileSchemaProvider", () => {
  let dir, dirPath;

  // set up a temp dir
  beforeEach(() => {
    dir = fs.mkdtempSync("__tmp__");
    dirPath = `${process.cwd()}/${dir}`;
  });

  // clean up our temp dir
  afterEach(() => {
    if (dir) deleteFolderRecursive(dir);
    dir = dirPath = undefined;
  });

  describe("resolveFederatedServiceSDL", () => {
    it("finds and loads sdl from graphql file for a federated service", async () => {
      writeFilesToDir(dir, {
        "schema.graphql": `
          extend type Query {
            myProduct: Product
          }

          type Product @key(fields: "id") {
            id: ID
            sku: ID
            name: String
          }
        `
      });

      const provider = new FileSchemaProvider({
        path: dir + "/schema.graphql"
      });
      const sdl = await provider.resolveFederatedServiceSDL();
      expect(sdl).toMatchInlineSnapshot;
    });

    it("finds and loads sdl from multiple graphql files for a federated service", async () => {
      writeFilesToDir(dir, {
        "schema.graphql": `
          extend type Query {
            myProduct: Product
          }

          type Product @key(fields: "id") {
            id: ID
            sku: ID
            name: String
          }`,
        "schema2.graphql": `
          extend type Product {
            weight: Float
          }`
      });

      const provider = new FileSchemaProvider({
        paths: [dir + "/schema.graphql", dir + "/schema2.graphql"]
      });
      const sdl = await provider.resolveFederatedServiceSDL();
      expect(sdl).toMatchInlineSnapshot(`
        "type Product @key(fields: \\"id\\") {
          id: ID
          sku: ID
          name: String
          weight: Float
        }

        extend type Query {
          myProduct: Product
        }
        "
      `);
    });

    it("errors when sdl file is not a graphql file", async () => {
      const toWrite = `
        module.exports = \`
        extend type Query {
          myProduct: Product
        }

        type Product @key(fields: "id") {
          id: ID
          sku: ID
          name: string
        }\`
      `;
      writeFilesToDir(dir, {
        "schema.js": toWrite
      });

      // noop -- just spy on and silence the error
      const errorSpy = jest.spyOn(Debug, "error");
      errorSpy.mockImplementation(() => {});

      const provider = new FileSchemaProvider({ path: dir + "/schema.js" });
      const sdl = await provider.resolveFederatedServiceSDL();
      expect(errorSpy).toBeCalledTimes(2);
    });
  });
});
