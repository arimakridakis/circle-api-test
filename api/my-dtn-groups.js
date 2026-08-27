export default async function handler(req, res) {
  const token = process.env.CIRCLE_API_TOKEN;
  const communityId = "527745";

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const email = req.query.email;
    const type = req.query.type;

    if (!email) {
      return res.status(400).json({
        error: "Missing ?email= parameter"
      });
    }

    // 1. Get every Space Group in DTN.
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

    const allGroups = await groupsResponse.json();

    // 2. Get the Spaces this particular member belongs to.
    const memberSpacesResponse = await fetch(
      `https://app.circle.so/api/v1/community_member_spaces?user_email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Token ${token}`
        }
      }
    );

    if (!memberSpacesResponse.ok) {
      throw new Error(
        `Circle member spaces API returned ${memberSpacesResponse.status}`
      );
    }

    const memberSpacesData = await memberSpacesResponse.json();
    const memberSpaces = memberSpacesData.records || [];

    // 3. Find the Space Group IDs represented among this member's Spaces.
    const memberGroupIds = new Set(
      memberSpaces
        .map(space => space.space_group_id)
        .filter(Boolean)
    );

    // 4. Classify DTN groups from their slugs.
    const groups = allGroups
      .filter(group => memberGroupIds.has(group.id))
      .map(group => {
        let groupType = null;

        if (group.slug.endsWith("-practice-group")) {
          groupType = "practice";
        }

        if (group.slug.endsWith("-local-group")) {
          groupType = "local";
        }

        if (!groupType) return null;

        // Find a Space in this group that the member can enter.
        const memberSpace = memberSpaces.find(
          space => space.space_group_id === group.id
        );

        return {
          id: group.id,
          name: group.name,
          slug: group.slug,
          type: groupType,
          url: memberSpace?.url || null
        };
      })
      .filter(Boolean)
      .filter(group => !type || group.type === type);

    res.status(200).json(groups);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
