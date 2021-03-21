import "isomorphic-fetch";

import gql from "graphql-tag";

import GraphqlClient from "./client";

describe("Test connection with `query me{username}`", () => {
  it("can connect to http://localhost:8000/graphql", async () => {
    try {
      const client = new GraphqlClient(
        new URL("http://localhost:8000/graphql")
      );
      const { data, errors } = await client.query(
        gql`
          query me {
            me {
              username
            }
          }
        `
      );

      expect(200).toBe(200);
    } catch (e) {
      expect(e.networkError.statusCode).toEqual(200);
    }
  });
});

describe("Test image query with drop specifications (Requires valid token in test)", () => {
  it("image query does not return id field although it is specified in the document", async () => {
    const client = new GraphqlClient(new URL("http://localhost:8000/graphql"));
    const { data, errors } = await client.query<{
      images: { fileHash: string; id: string }[];
    }>(
      gql`
        query queryImages {
          images(
            token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImNpc2NvIiwiZXhwIjoxNjExMjk2NjY4LCJvcmlnSWF0IjoxNjExMjk2MzY4fQ.YCe8aGWIuyY2EM1IwSPtArzDselRrGvQZx7awvOlmio"
          ) {
            fileHash
            id
          }
        }
      `
    );

    expect("id" in data.images[0]).toEqual(false);
  });
});

describe("Test pages query with drop specifications (Requires valid token in test)", () => {
  it("image query does not return id field although it is specified in the document", async () => {
    const client = new GraphqlClient(new URL("http://localhost:8000/graphql"));
    const { data, errors } = await client.query<{}>(
      gql`
        fragment pageInterfaceFields_pagesQuery on PageInterface {
          __typename
          id
          url
          urlPath
          slug
          depth
          pageType
          title
          seoTitle
          seoDescription
          showInMenus
          contentType
          lastPublishedAt
          ... on HomePage {
            ...homePageFields_pagesQuery
          }
          ... on ArticlesPage {
            ...articlesPageFields_pagesQuery
          }
          ... on TeamPage {
            ...teamPageFields_pagesQuery
          }
          ... on PromisePage {
            ...promisePageFields_pagesQuery
          }
          ... on PositionPointsPage {
            ...positionPointsPageFields_pagesQuery
          }
          ... on Folder {
            ...folderFields_pagesQuery
          }
          ... on Page {
            ...pageFields_pagesQuery
          }
        }
        fragment streamFieldInterfaceFields_pagesQuery on StreamFieldInterface {
          __typename
          id
          blockType
          field
          rawValue
          ... on StreamFieldBlock {
            ...streamFieldBlockFields_pagesQuery
          }
          ... on StreamBlock {
            ...streamBlockFields_pagesQuery
          }
          ... on StructBlock {
            ...structBlockFields_pagesQuery
          }
          ... on EmbedBlock {
            ...embedBlockFields_pagesQuery
          }
          ... on _H_HeroBlock {
            ..._H_HeroBlockFields_pagesQuery
          }
          ... on _H_SimpleHeroBlock {
            ..._H_SimpleHeroBlockFields_pagesQuery
          }
          ... on PeoplePersonBlock {
            ...peoplePersonBlockFields_pagesQuery
          }
          ... on CTAActionBlock {
            ...cTAActionBlockFields_pagesQuery
          }
          ... on _S_ContentCenter {
            ..._S_ContentCenterFields_pagesQuery
          }
          ... on _S_ContentRight {
            ..._S_ContentRightFields_pagesQuery
          }
          ... on _S_ContentLeft {
            ..._S_ContentLeftFields_pagesQuery
          }
          ... on TeamPersonBlock {
            ...teamPersonBlockFields_pagesQuery
          }
        }
        fragment streamFieldBlockFields_pagesQuery on StreamFieldBlock {
          __typename
          id
          blockType
          field
          rawValue
          value
        }
        fragment streamBlockFields_pagesQuery on StreamBlock {
          __typename
          id
          blockType
          field
          rawValue
        }
        fragment structBlockFields_pagesQuery on StructBlock {
          __typename
          id
          blockType
          field
          rawValue
        }
        fragment embedBlockFields_pagesQuery on EmbedBlock {
          __typename
          id
          blockType
          field
          rawValue
          value
          url
          embed
          rawEmbed
        }
        fragment userFields_pagesQuery on User {
          __typename
          id
          username
          address
        }
        fragment imageRenditionObjectTypeFields_pagesQuery on ImageRenditionObjectType {
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
        fragment imageObjectTypeFields_pagesQuery on ImageObjectType {
          __typename
          id
          title
          file
          width
          height
          createdAt
          uploadedByUser {
            ...userFields_pagesQuery
          }
          focalPointX
          focalPointY
          focalPointWidth
          focalPointHeight
          fileSize
          fileHash
          renditions {
            ...imageRenditionObjectTypeFields_pagesQuery
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
            ...imageRenditionObjectTypeFields_pagesQuery
          }
          srcSet
        }
        fragment _H_HeroBlockFields_pagesQuery on _H_HeroBlock {
          __typename
          id
          blockType
          field
          rawValue
          slideImage {
            ...imageObjectTypeFields_pagesQuery
          }
          slideTophead
          slideHead
          slideLead
          slideText
        }
        fragment _H_SimpleHeroBlockFields_pagesQuery on _H_SimpleHeroBlock {
          __typename
          id
          blockType
          field
          rawValue
          slideImage {
            ...imageObjectTypeFields_pagesQuery
          }
          slideTophead
          slideHead
          slideLead
          slideText
        }
        fragment peoplePersonBlockFields_pagesQuery on PeoplePersonBlock {
          __typename
          id
          blockType
          field
          rawValue
          personText
          personImage {
            ...imageObjectTypeFields_pagesQuery
          }
          personName
          personAge
          personInfo
        }
        fragment cTAActionBlockFields_pagesQuery on CTAActionBlock {
          __typename
          id
          blockType
          field
          rawValue
          ctaImage {
            ...imageObjectTypeFields_pagesQuery
          }
          ctaHead
          ctaLink
        }
        fragment _S_ContentCenterFields_pagesQuery on _S_ContentCenter {
          __typename
          id
          blockType
          field
          rawValue
          contentCenterHead
          contentCenterLead
          contentCenterText
        }
        fragment _S_ContentRightFields_pagesQuery on _S_ContentRight {
          __typename
          id
          blockType
          field
          rawValue
          contentRightImg {
            ...imageObjectTypeFields_pagesQuery
          }
          contentRightHead
          contentRightLead
          contentRightText
        }
        fragment _S_ContentLeftFields_pagesQuery on _S_ContentLeft {
          __typename
          id
          blockType
          field
          rawValue
          contentLeftImg {
            ...imageObjectTypeFields_pagesQuery
          }
          contentLeftHead
          contentLeftLead
          contentLeftText
        }
        fragment teamPersonBlockFields_pagesQuery on TeamPersonBlock {
          __typename
          id
          blockType
          field
          rawValue
          personImage {
            ...imageObjectTypeFields_pagesQuery
          }
          personName
          personPosition
          personInfo
          personEmail
          personTel
          personFacebook
          personTwitter
        }
        fragment homePageFields_pagesQuery on HomePage {
          __typename
          id
          depth
          title
          slug
          contentType
          urlPath
          seoTitle
          showInMenus
          lastPublishedAt
          about
          privacy
          headers {
            ...streamFieldInterfaceFields_pagesQuery
          }
          quoteImage {
            ...imageObjectTypeFields_pagesQuery
          }
          quoteText
          youtubeLink
          youtubeHead
          youtubeLead
          youtubeText
          references {
            ...streamFieldInterfaceFields_pagesQuery
          }
          calltoactions {
            ...streamFieldInterfaceFields_pagesQuery
          }
          electionDate
          url
          pageType
          seoDescription
        }
        fragment articlesPageFields_pagesQuery on ArticlesPage {
          __typename
          id
          depth
          title
          slug
          contentType
          urlPath
          seoTitle
          showInMenus
          lastPublishedAt
          headers {
            ...streamFieldInterfaceFields_pagesQuery
          }
          arType
          arDate
          sections {
            ...streamFieldInterfaceFields_pagesQuery
          }
          url
          pageType
          seoDescription
        }
        fragment teamPageFields_pagesQuery on TeamPage {
          __typename
          id
          depth
          title
          slug
          contentType
          urlPath
          seoTitle
          showInMenus
          lastPublishedAt
          sections {
            ...streamFieldInterfaceFields_pagesQuery
          }
          team {
            ...streamFieldInterfaceFields_pagesQuery
          }
          url
          pageType
          seoDescription
        }
        fragment promisePageFields_pagesQuery on PromisePage {
          __typename
          id
          depth
          title
          slug
          contentType
          urlPath
          seoTitle
          showInMenus
          lastPublishedAt
          headImage {
            ...imageObjectTypeFields_pagesQuery
          }
          headText
          sections {
            ...streamFieldInterfaceFields_pagesQuery
          }
          url
          pageType
          seoDescription
        }
        fragment positionPointsPageFields_pagesQuery on PositionPointsPage {
          __typename
          id
          depth
          title
          slug
          contentType
          urlPath
          seoTitle
          showInMenus
          lastPublishedAt
          sections {
            ...streamFieldInterfaceFields_pagesQuery
          }
          url
          pageType
          seoDescription
        }
        fragment folderFields_pagesQuery on Folder {
          __typename
          id
          depth
          title
          slug
          contentType
          urlPath
          seoTitle
          showInMenus
          lastPublishedAt
          url
          pageType
          seoDescription
        }
        fragment pageFields_pagesQuery on Page {
          __typename
          id
          path
          depth
          numchild
          translationKey
          title
          draftTitle
          slug
          contentType
          live
          hasUnpublishedChanges
          urlPath
          owner {
            ...userFields_pagesQuery
          }
          seoTitle
          showInMenus
          searchDescription
          goLiveAt
          expireAt
          expired
          locked
          lockedAt
          lockedBy {
            ...userFields_pagesQuery
          }
          firstPublishedAt
          lastPublishedAt
          latestRevisionCreatedAt
          aliasOf {
            __typename
          }
          aliases {
            __typename
          }
          homepage {
            ...homePageFields_pagesQuery
          }
          articlespage {
            ...articlesPageFields_pagesQuery
          }
          teampage {
            ...teamPageFields_pagesQuery
          }
          promisepage {
            ...promisePageFields_pagesQuery
          }
          positionpointspage {
            ...positionPointsPageFields_pagesQuery
          }
          folder {
            ...folderFields_pagesQuery
          }
          url
          pageType
          seoDescription
        }
        query pagesQuery(
          $max: String
          $min: String
          $width: Int
          $height: Int
          $fill: String
          $format: String
          $bgcolor: String
          $jpegquality: Int
          $token: String
          $limit: PositiveInt
          $offset: PositiveInt
          $order: String
          $searchQuery: String
          $id: ID
        ) {
          pages(
            token: $token
            limit: $limit
            offset: $offset
            order: $order
            searchQuery: $searchQuery
            id: $id
          ) {
            __typename
            ...pageInterfaceFields_pagesQuery
          }
        }
      `,
      {
        token:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImNpc2NvIiwiZXhwIjoxNjEyMjc1NzE3LCJvcmlnSWF0IjoxNjEyMjc1NDE3fQ.UFvIu0XfbyFr5pKCGdKp72OS0J2Gg7CS_S6IvjKDkS4",
      }
    );
    console.log(data, errors);

    expect("id" in data).toEqual(false);
  });
});
