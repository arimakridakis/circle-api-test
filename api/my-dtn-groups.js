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

    const candidateGroups = allGroups
      .map(group => {
        let groupType = null;

        if (group.slug.endsWith("-practice-group")) {
          groupType = "practice";
        } else if (group.slug.endsWith("-local-group")) {
          groupType = "local";
        }

        if (!groupType) return null;

        return {
          ...group,
          groupType
        };
      })
      .filter(Boolean)
      .filter(group => !type || group.groupType === type);

    const membershipChecks = await Promise.all(
      candidateGroups.map(async group => {
        const url =
          "https://app.circle.so/api/v1/space_group_member" +
          `?community_id=${communityId}` +
          `&space_group_id=${group.id}` +
          `&email=${encodeURIComponent(email)}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Token ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(
            `Membership lookup for ${group.name} returned ${response.status}`
          );
        }

        const membership = await response.json();

        // Non-member response:
        // { success: false, message: "SpaceGroupMember record not found" }
        if (membership.success === false) {
          return null;
        }

        if (membership.status !== "active") {
          return null;
        }

        return {
          id: group.id,
          name: group.name,
          slug: group.slug,
          type: group.groupType
        };
      })
    );

    res.status(200).json(
      membershipChecks.filter(Boolean)
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
}
