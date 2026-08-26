export default async function handler(req, res) {
  const token = process.env.CIRCLE_API_TOKEN;
  const communityId = "527745";

  try {
    const response = await fetch(
      `https://app.circle.so/api/v1/spaces?community_id=${communityId}&per_page=100`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Circle API returned ${response.status}`);
    }

    const spaces = await response.json();

    const filtered = spaces
      .filter(space => space.space_group_name === "ACE")
      .map(space => ({
        id: space.id,
        name: space.name,
        url: space.url,
        type: space.space_type,
        emoji: space.emoji,
        icon: space.custom_emoji_url,
        private: space.is_private
      }));

    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://dtnetwork-org.circle.so"
    );

    res.status(200).json(filtered);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
