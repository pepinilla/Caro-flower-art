import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const images = [
  "https://caroflower.com/images/studio-life/arch1.webp",
  "https://caroflower.com/images/studio-life/arch2.webp"
]

async function generatePost(image) {

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You write short elegant descriptions for handmade paper flowers. No emojis."
      },
      {
        role: "user",
        content: `Describe this floral piece for a social media post. Focus on handmade details and elegance. Image: ${image}`
      }
    ]
  })

  const text = response.choices[0].message.content

  await supabase.from("social_posts").insert({
    platform: "instagram",
    status: "pending",
    content: text,
    image_urls: [image]
  })

}

async function run() {

  for (const image of images) {
    await generatePost(image)
  }

  console.log("posts generated")

}

run()
