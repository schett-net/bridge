/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import "isomorphic-fetch";

import { print } from "graphql";
import gql from "graphql-tag";

import { specifier } from "./specifier";

describe("Test query minifying based on configuration settings", () => {
  it("affects documents when no settings are provided", () => {
    const document = gql`
      query foo {
        foo
      }
    `;

    const expectedDocument = gql`
      query foo {
        foo
      }
    `;
    expect(specifier(document)).toBe(expectedDocument);
  });
  it("does basic excluding according to provided settings", () => {
    /**
     * !You must use unique documents for testing or it fails.
     */
    const document = gql`
      query usersQuery1($token: String!) {
        users(token: $token) {
          id
          username
          address
        }
      }
    `;

    const settings = {
      users: {
        id: false,
        address: false,
      },
    };

    const expectedDocument = gql`
      query usersQuery1($token: String!) {
        users(token: $token) {
          username
        }
      }
    `;

    const res = specifier(document, settings);

    expect(res).toBe(expectedDocument);
  });
  it("does basic excluding of all fields but `foo=true` (in setting) when `defaultExclude=true` (in setting)", () => {
    const document = gql`
      query usersQuery2($token: String!) {
        users(token: $token) {
          id
          username
          address
        }
      }
    `;

    const settings = {
      users: {
        excludeFields: true,
        id: true,
      },
    };

    const expectedDocument = gql`
      query usersQuery2($token: String!) {
        users(token: $token) {
          id
        }
      }
    `;
    expect(specifier(document, settings)).toBe(expectedDocument);
  });
  it("does not remove variable definitions if at least one node accesses them", () => {
    const document = gql`
      query usersQuery3($token: String!, $name: String!) {
        users(token: $token) {
          id
          username
          address
          car(name: $name) {
            username
          }
          ship(name: $name) {
            username
          }
        }
      }
    `;

    const settings = {
      users: {
        car: false,
      },
    };

    const expectedDocument = gql`
      query usersQuery3($token: String!, $name: String!) {
        users(token: $token) {
          id
          username
          address
          ship(name: $name) {
            username
          }
        }
      }
    `;

    expect(specifier(document, settings)).toBe(expectedDocument);
  });
  it("does remove variable definitions if no node accesses them", () => {
    const document = gql`
      query usersQuery4($token: String!, $name: String!) {
        users(token: $token) {
          id
          username
          address
          car(name: $name) {
            username
          }
          ship(name: $name) {
            username
          }
        }
      }
    `;

    const settings = {
      users: {
        car: false,
        ship: false,
      },
    };

    const expectedDocument = gql`
      query usersQuery4($token: String!) {
        users(token: $token) {
          id
          username
          address
        }
      }
    `;

    expect(specifier(document, settings)).toBe(expectedDocument);
  });
  it("handles documents containing unions and interfaces", () => {
    const document = gql`
      query usersQuery5($token: String!, $name: String!) {
        users(token: $token) {
          id
          username
          address
          ... on Smart {
            iq
          }
          ... on Goofy {
            iq
          }
        }
        users2(token: $token) {
          ... on Smart {
            iq
          }
          ... on Goofy {
            eq
          }
        }
      }
    `;

    const settings = {
      users: {
        Goofy: false,
      },
      users2: {
        Goofy: false,
      },
    };

    const expectedDocument = gql`
      query usersQuery5($token: String!) {
        users(token: $token) {
          id
          username
          address
          ... on Smart {
            iq
          }
        }
        users2(token: $token) {
          ... on Smart {
            iq
          }
        }
      }
    `;

    expect(specifier(document, settings)).toBe(expectedDocument);
  });
  it("handles interfaces of pages", () => {
    const document = gql`
      query usersQuery6($token: String!) {
        pages(token: $token) {
          ... on HomePage {
            id
          }
          ... on PromisePage {
            id
          }
        }
      }
    `;

    const settings = {
      pages: {
        HomePage: false,
      },
    };

    const expectedDocument = gql`
      query usersQuery6($token: String!) {
        pages(token: $token) {
          ... on PromisePage {
            id
          }
        }
      }
    `;

    expect(specifier(document, settings)).toBe(expectedDocument);
  });
  it("handles a large and complex document", () => {
    const document = gql`
      query imagesQuery(
        $sizes: [Int]
        $max: String
        $min: String
        $width: Int
        $height: Int
        $fill: String
        $format: String
        $bgcolor: String
        $jpegquality: Int
        $sizes1: [Int]
        $max1: String
        $min1: String
        $width1: Int
        $height1: Int
        $fill1: String
        $format1: String
        $bgcolor1: String
        $jpegquality1: Int
        $sizes2: [Int]
        $token: String
        $limit: PositiveInt
        $offset: PositiveInt
        $order: String
        $searchQuery: String
        $id: ID
      ) {
        images(
          token: $token
          limit: $limit
          offset: $offset
          order: $order
          searchQuery: $searchQuery
          id: $id
        ) {
          __typename
          id
          title
          file
          width
          height
          createdAt
          uploadedByUser {
            __typename
            id
            username
            address
          }
          focalPointX
          focalPointY
          focalPointWidth
          focalPointHeight
          fileSize
          fileHash
          renditions {
            __typename
            id
            filterSpec
            file
            width
            height
            focalPointKey
            image {
              __typename
              id
              title
              file
              width
              height
              createdAt
              uploadedByUser {
                __typename
                id
                username
                address
              }
              focalPointX
              focalPointY
              focalPointWidth
              focalPointHeight
              fileSize
              fileHash
              renditions {
                __typename
                id
                filterSpec
                file
                width
                height
                focalPointKey
                src
                aspectRatio
                sizes
                url
              }
              src
              aspectRatio
              sizes
              rendition(
                max: $max
                min: $min
                width: $width
                height: $height
                fill: $fill
                format: $format
                bgcolor: $bgcolor
                jpegquality: $jpegquality
              ) {
                __typename
                id
                filterSpec
                file
                width
                height
                focalPointKey
                image {
                  __typename
                  id
                  title
                  file
                  width
                  height
                  createdAt
                  focalPointX
                  focalPointY
                  focalPointWidth
                  focalPointHeight
                  fileSize
                  fileHash
                  src
                  aspectRatio
                  sizes
                  srcSet(sizes: $sizes)
                }
                src
                aspectRatio
                sizes
                url
              }
              srcSet(sizes: $sizes1)
            }
            src
            aspectRatio
            sizes
            url
          }
          src
          aspectRatio
          sizes
          rendition(
            max: $max1
            min: $min1
            width: $width1
            height: $height1
            fill: $fill1
            format: $format1
            bgcolor: $bgcolor1
            jpegquality: $jpegquality1
          ) {
            __typename
            id
            filterSpec
            file
            width
            height
            focalPointKey
            src
            aspectRatio
            sizes
            url
          }
          srcSet(sizes: $sizes2)
        }
      }
    `;

    const settings = {
      images: {
        excludeFields: true,
        fileSize: true,
        fileHash: true,
        uploadedByUser: {
          excludeFields: true,
          __typename: true,
          id: true,
        },
      },
    };

    const expectedDocument = gql`
      query imagesQuery(
        $token: String
        $limit: PositiveInt
        $offset: PositiveInt
        $order: String
        $searchQuery: String
        $id: ID
      ) {
        images(
          token: $token
          limit: $limit
          offset: $offset
          order: $order
          searchQuery: $searchQuery
          id: $id
        ) {
          uploadedByUser {
            __typename
            id
          }
          fileSize
          fileHash
        }
      }
    `;

    expect(specifier(document, settings)).toBe(
      gql`
        ${print(expectedDocument)}
      `
    );
  });
  it("does not crash when fragments are used", () => {
    const document = gql`
      fragment testVariables on Test {
        foo
      }

      query foo {
        ...testVariables
      }
    `;

    const expectedDocument = gql`
      fragment testVariables on Test {
        foo
      }

      query foo {
        ...testVariables
      }
    `;
    expect(specifier(document)).toBe(expectedDocument);
  });
});

describe("Test query minifying based on configuration file", () => {
  it("affects documents when no custom settings are provided (configuration file is defined)", () => {
    const document = gql`
      query imagesQuery2(
        $sizes: [Int]
        $max: String
        $min: String
        $width: Int
        $height: Int
        $fill: String
        $format: String
        $bgcolor: String
        $jpegquality: Int
        $sizes1: [Int]
        $max1: String
        $min1: String
        $width1: Int
        $height1: Int
        $fill1: String
        $format1: String
        $bgcolor1: String
        $jpegquality1: Int
        $sizes2: [Int]
        $token: String
        $limit: PositiveInt
        $offset: PositiveInt
        $order: String
        $searchQuery: String
        $id: ID
      ) {
        images(
          token: $token
          limit: $limit
          offset: $offset
          order: $order
          searchQuery: $searchQuery
          id: $id
        ) {
          __typename
          id
          title
          file
          width
          height
          createdAt
          uploadedByUser {
            __typename
            id
            username
            address
          }
          focalPointX
          focalPointY
          focalPointWidth
          focalPointHeight
          fileSize
          fileHash
          renditions {
            __typename
            id
            filterSpec
            file
            width
            height
            focalPointKey
            image {
              __typename
              id
              title
              file
              width
              height
              createdAt
              uploadedByUser {
                __typename
                id
                username
                address
              }
              focalPointX
              focalPointY
              focalPointWidth
              focalPointHeight
              fileSize
              fileHash
              renditions {
                __typename
                id
                filterSpec
                file
                width
                height
                focalPointKey
                src
                aspectRatio
                sizes
                url
              }
              src
              aspectRatio
              sizes
              rendition(
                max: $max
                min: $min
                width: $width
                height: $height
                fill: $fill
                format: $format
                bgcolor: $bgcolor
                jpegquality: $jpegquality
              ) {
                __typename
                id
                filterSpec
                file
                width
                height
                focalPointKey
                image {
                  __typename
                  id
                  title
                  file
                  width
                  height
                  createdAt
                  focalPointX
                  focalPointY
                  focalPointWidth
                  focalPointHeight
                  fileSize
                  fileHash
                  src
                  aspectRatio
                  sizes
                  srcSet(sizes: $sizes)
                }
                src
                aspectRatio
                sizes
                url
              }
              srcSet(sizes: $sizes1)
            }
            src
            aspectRatio
            sizes
            url
          }
          src
          aspectRatio
          sizes
          rendition(
            max: $max1
            min: $min1
            width: $width1
            height: $height1
            fill: $fill1
            format: $format1
            bgcolor: $bgcolor1
            jpegquality: $jpegquality1
          ) {
            __typename
            id
            filterSpec
            file
            width
            height
            focalPointKey
            src
            aspectRatio
            sizes
            url
          }
          srcSet(sizes: $sizes2)
        }
      }
    `;

    const expectedDocument = gql`
      query imagesQuery2(
        $token: String
        $limit: PositiveInt
        $offset: PositiveInt
        $order: String
        $searchQuery: String
        $id: ID
      ) {
        images(
          token: $token
          limit: $limit
          offset: $offset
          order: $order
          searchQuery: $searchQuery
          id: $id
        ) {
          uploadedByUser {
            __typename
            id
          }
          fileHash
        }
      }
    `;
    expect(specifier(document)).toBe(gql`
      ${print(expectedDocument)}
    `);
  });
});
