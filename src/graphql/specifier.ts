/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import { DocumentNode, print } from "graphql";
import gql from "graphql-tag";

import { BifrostBridge } from "../index";

export const specifier = (
  document: DocumentNode,
  settings?: { [key: string]: any }
) => {
  if (!settings) {
    try {
      settings = BifrostBridge.config.specifications;
    } catch (err) {
      console.info("Could not load custom configuration file", err);
      return document;
    }
  }

  let documentNode: DocumentNode = document;
  let newDefinitions = minifySelectionsFromASTDefinition(
    documentNode.definitions,
    settings
  );

  /**
   * This part kills the performance :(
   */
  const variablesAfter = getVariablesFromASTDefinitions(newDefinitions);
  newDefinitions = removeVariablesFromASTDefinitions(
    newDefinitions,
    variablesAfter
  );

  /**
   * Print and rebuild gql DocumentNode to update `loc.end`.
   */
  const newDocument = gql`
    ${print({
      ...documentNode,
      definitions: newDefinitions,
    })}
  `;

  return newDocument;
};

const minifySelectionsFromASTDefinition = (
  selections: any,
  settingsLayer: any = {}
) => {
  let newSelections = [];

  /**
   * Default settings
   */
  const { excludeFields = false } = settingsLayer;

  for (let selection of selections) {
    const fieldName =
      selection.name?.value || selection.typeCondition?.name?.value;
    if (selection.kind === "OperationDefinition") {
      selection.selectionSet.selections = minifySelectionsFromASTDefinition(
        selection.selectionSet.selections,
        settingsLayer
      );

      newSelections.push(selection);
    } else if (
      (fieldName === "__typename" && settingsLayer[fieldName]) ||
      (!excludeFields && settingsLayer[fieldName] !== false) ||
      (excludeFields && settingsLayer[fieldName])
    ) {
      if (selection.selectionSet) {
        selection.selectionSet.selections = minifySelectionsFromASTDefinition(
          selection.selectionSet.selections,
          settingsLayer[fieldName]
        );

        newSelections.push(selection);
      } else {
        newSelections.push(selection);
      }
    }
  }
  return newSelections;
};

const getVariablesFromASTDefinitions = (obj: any) => {
  obj = JSON.parse(JSON.stringify(obj));
  const flatten = (obj: any) => {
    const array = Array.isArray(obj) ? obj : [obj];
    return array.reduce((acc, value) => {
      value?.arguments?.forEach((argument: any) => {
        const value = argument.value.name?.value;

        if (value) {
          acc.push(value);
        }
      });

      if (Array.isArray(value?.selectionSet?.selections)) {
        acc = acc.concat(flatten(value.selectionSet.selections));
        delete value.selectionSet.selections;
      }
      return acc;
    }, []);
  };

  const uniqueCount: string[] = flatten(obj);

  let count: { [key: string]: number } = {};

  uniqueCount.forEach(function (i) {
    count[i] = (count[i] || 0) + 1;
  });

  return count;
};

const removeVariablesFromASTDefinitions = (
  obj: any,
  values: { [key: string]: number }
) => {
  const newObj = obj.map((e: any) => ({
    ...e,
    variableDefinitions: e.variableDefinitions?.filter(
      (vd: any) => vd.variable.name.value in values
    ),
  }));

  return newObj;
};
