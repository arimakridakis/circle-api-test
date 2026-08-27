export default async function handler(req, res) {
  const token = process.env.CIRCLE_API_TOKEN;
  const communityId = "527745";

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const type = req.query.type;

    // Get all Circle Space Groups
    const groupsResponse = await fetch(
      `https://app.circle.so/api/v1/space_groups?community_id=${communityId}`,
      {
        headers: {
          Authorization: `Token ${token}`
        }
      }
    );

    if (!groupsResponse.ok) {
      throw new Error(
        `Circle Space Groups API returned ${groupsResponse.status}`
      );
    }

    const groups = await groupsResponse.json();

    // Also get Spaces so we can give each group a working destination URL.
    const spacesResponse = await fetch(
      `https://app.circle.so/api/v1/spaces?community_id=${communityId}&per_page=100`,
      {
        headers: {
          Authorization: `Token ${token}`
        }
      }
    );

    if (!spacesResponse.ok) {
      throw new Error(
        `Circle Spaces API returned ${spacesResponse.status}`
      );
    }

    const spaces = await spacesResponse.json();

    const classified = groups
      .map(group => {
        let groupType = null;

        if (group.slug.endsWith("-practice-group")) {
          groupType = "practice";
        }

        if (group.slug.endsWith("-local-group")) {
          groupType = "local";
        }

        if (!groupType) return null;

        // Use the first Space in the Space Group as its entry point.
        const firstSpaceId = group.space_order_array?.[0];

        const firstSpace = spaces.find(
          space => space.id === firstSpaceId
        );

        return {
          id: group.id,
          name: group.name,
          slug: group.slug,
          type: groupType,
          url: firstSpace?.url || null
        };
      })
      .filter(Boolean)
      .filter(group => !type || group.type === type);

    res.status(200).json(classified);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
