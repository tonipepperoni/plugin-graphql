/* istanbul ignore file */
import { Database, Model as ORMModel, BelongsTo, BelongsToMany, HasMany } from "@vuex-orm/core";
import RootState from "@vuex-orm/core/lib/modules/contracts/RootState";
import { ApolloLink } from "apollo-link";
import { DocumentNode } from "graphql/language/ast";
import Adapter from "../adapters/adapter";
import Relation from "@vuex-orm/core/lib/attributes/relations/Relation";
import Model from "../orm/model";

export type DispatchFunction = (action: string, data: Data) => Promise<any>;

export interface Options {
  database: Database;
  url?: string;
  headers?: { [index: string]: any };
  credentials?: string;
  useGETForQueries?: boolean;
  debug?: boolean;
  link?: ApolloLink;
  adapter?: Adapter;
}

export interface ActionParams {
  commit?: any;
  dispatch?: DispatchFunction;
  getters?: any;
  rootGetters?: any;
  rootState?: any;
  state?: RootState;
  filter?: Filter;
  id?: number;
  data?: Data;
  args?: Arguments;
  variables?: Arguments;
  bypassCache?: boolean;
  query?: string | DocumentNode;
  multiple?: boolean;
  name?: string;
}

export interface Data {
  [index: string]: any;
}

export interface Filter {
  [index: string]: any;
}

export interface Arguments {
  [index: string]: any;
}

export interface GraphQLType {
  description: string;
  name: string;
  fields?: Array<GraphQLField>;
  inputFields?: Array<GraphQLField>;
}

export interface GraphQLField {
  description: string;
  name: string;
  args: Array<GraphQLField>;
  type: GraphQLTypeDefinition;
}

export interface GraphQLTypeDefinition {
  kind: string;
  name?: string;
  ofType: GraphQLTypeDefinition;
}

export interface GraphQLSchema {
  types: Array<GraphQLType>;
}

export interface Field {
  related?: ORMModel;
  parent?: ORMModel;
  localKey?: string;
  foreignKey?: string;
}

export class PatchedModel extends ORMModel {
  static eagerTempSync: Array<String> = [];
  static modelsWithEagerLoads: Array<ORMModel> = [];

  public getRelations(): Map<string, Relation> {
    const relations = new Map<string, Relation>();

    this.fields.forEach((field: Field, name: string) => {
      if (!Model.isFieldAttribute(field)) {
        relations.set(name, field as Relation);
      }
    });

    return relations;
  }

  public setMultiLevelRelations(loadList: Array<string>, nextLevelRelatedModel?: ORMModel) {
    for (let rel of loadList) {
      let nestedRelationships = rel.split(".");

      if (nestedRelationships.length > 0) {
        let fieldName = nestedRelationships[0];
        let eagerLoad = nestedRelationships[1];

        if (!nextLevelRelatedModel) {
          if (!(this.eagerTempSync instanceof Array)) {
            this.eagerTempSync = [];
          }
          this.eagerTempSync.push(nestedRelationships[0]);
        }

        let currentModel: ORMModel = nextLevelRelatedModel || this;

        const relatedModel: ORMModel | null = currentModel.getRelatedModel(fieldName);
        if (relatedModel) {
          if (!(relatedModel.eagerTempSync instanceof Array)) {
            relatedModel.eagerTempSync = [];
          }
          relatedModel.eagerTempSync.push(eagerLoad);
          this.modelsWithEagerLoads.push(relatedModel);

          nestedRelationships.shift();

          if (nestedRelationships.length > 1) {
            let restRelations = [nestedRelationships.join(".")];

            if (restRelations[0].length > 0) {
              this.setMultiLevelRelations(restRelations, relatedModel);
            }
          }
        }
      }
    }
  }

  public with(loadList: Array<string>) {
    this.setMultiLevelRelations(loadList);
    return this;
  }

  static async pull(filter?: any, bypassCache: boolean = false): Promise<any> {
    if (this.modelsWithEagerLoads.length > 0) {
      let p = this.fetch(filter, bypassCache);
      return p.then(() => {
        this.eagerTempSync = [];
        this.modelsWithEagerLoads = [];
      });
    } else {
      return this.fetch(filter, bypassCache);
    }
  }

  static async fetch(filter?: any, bypassCache: boolean = false): Promise<any> {
    return undefined;
  }
  static async get(filter?: any, bypassCache: boolean = false): Promise<any> {
    return undefined;
  }

  static async mutate(params: ActionParams): Promise<any> {
    return undefined;
  }
  static async customQuery(params: ActionParams): Promise<any> {
    return undefined;
  }
}
