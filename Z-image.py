import gradio as gr
from openai import OpenAI
import base64
import requests
from PIL import Image
import io

# Default values from your provided script
DEFAULT_PROMPT = "一张虚构的英语电影《回忆之味》（The Taste of Memory）的电影海报。场景设置在一个质朴的19世纪风格厨房里。画面中央，一位红棕色头发、留着小胡子的中年男子（演员阿瑟·彭哈利根饰）站在一张木桌后，他身穿白色衬衫、黑色马甲和米色围裙，正看着一位女士，手中拿着一大块生红肉，下方是一个木制切菜板。在他的右边，一位梳着高髻的黑发女子（演员埃莉诺·万斯饰）倚靠在桌子上，温柔地对他微笑。她穿着浅色衬衫和一条上白下蓝的长裙。桌上除了放有切碎的葱和卷心菜丝的切菜板外，还有一个白色陶瓷盘、新鲜香草，左侧一个木箱上放着一串深色葡萄。背景是一面粗糙的灰白色抹灰墙，墙上挂着一幅风景画。最右边的一个台面上放着一盏复古油灯。海报上有大量的文字信息。左上角是白色的无衬线字体\\\"ARTISAN FILMS PRESENTS\\\"，其下方是\\\"ELEANOR VANCE\\\"和\\\"ACADEMY AWARD® WINNER\\\"。右上角写着\\\"ARTHUR PENHALIGON\\\"和\\\"GOLDEN GLOBE® AWARD WINNER\\\"。顶部中央是圣丹斯电影节的桂冠标志，下方写着\\\"SUNDANCE FILM FESTIVAL GRAND JURY PRIZE 2024\\\"。主标题\\\"THE TASTE OF MEMORY\\\"以白色的大号衬线字体醒目地显示在下半部分。标题下方注明了\\\"A FILM BY Tongyi Interaction Lab\\\"。底部区域用白色小字列出了完整的演职员名单，包括\\\"SCREENPLAY BY ANNA REID\\\"、\\\"CULINARY DIRECTION BY JAMES CARTER\\\"以及Artisan Films、Riverstone Pictures和Heritage Media等众多出品公司标志。整体风格是写实主义，采用温暖柔和的灯光方案，营造出一种亲密的氛围。色调以棕色、米色和柔和的绿色等大地色系为主。两位演员的身体都在腰部被截断"
DEFAULT_NEGATIVE_PROMPT = "低质量, 丑陋, 畸形, 模糊, 多余的肢体, 错误的文本"

# Aspect ratio presets
ASPECT_RATIOS = {
    "1:1 (256×256)": (256, 256),
    "1:1 (512×512)": (512, 512),
    "1:1 (1024×1024)": (1024, 1024),
    "1:1 (2048×2048)": (2048, 2048),
    "4:3 (1152×896)": (1152, 896),
    "4:3 (2048×1536)": (2048, 1536),
    "3:4 (768×1024)": (768, 1024),
    "3:4 (1536×2048)": (1536, 2048),
    "3:2 (2048×1360)": (2048, 1360),
    "2:3 (1360×2048)": (1360, 2048),
    "16:9 (1024×576)": (1024, 576),
    "16:9 (2048×1152)": (2048, 1152),
    "9:16 (576×1024)": (576, 1024),
    "9:16 (1152×2048)": (1152, 2048),
}

def update_dimensions(aspect_ratio_choice):
    """
    Update width and height based on selected aspect ratio.
    """
    if aspect_ratio_choice and aspect_ratio_choice in ASPECT_RATIOS:
        width, height = ASPECT_RATIOS[aspect_ratio_choice]
        return width, height
    return gr.update(), gr.update()

def generate_image(api_key, prompt, negative_prompt, model, width, height, num_steps):
    """
    Function to call the image generation API and return the image.
    """
    if not api_key:
        raise gr.Error("API Key is required.")
        
    status_update = "Initializing client..."
    print(status_update)

    try:
        client = OpenAI(
            base_url="https://ai.gitee.com/v1",
            api_key=api_key.strip(),
        )

        status_update = "Generating image... this may take a moment."
        print(status_update)

        response = client.images.generate(
            prompt=prompt,
            model=model,
            size=f"{width}x{height}",
            extra_body={
                "negative_prompt": negative_prompt,
                "num_inference_steps": num_steps,
            },
        )

        status_update = "Processing response..."
        print(status_update)

        image_obj = None
        if response.data and response.data[0]:
            image_data = response.data[0]
            if image_data.url:
                status_update = f"Downloading image from URL..."
                print(status_update)
                res = requests.get(image_data.url, timeout=60)
                res.raise_for_status()
                image_bytes = res.content
                image_obj = Image.open(io.BytesIO(image_bytes))

            elif image_data.b64_json:
                status_update = "Decoding base64 image..."
                print(status_update)
                image_bytes = base64.b64decode(image_data.b64_json)
                image_obj = Image.open(io.BytesIO(image_bytes))

        if image_obj:
            status_update = "Image generated successfully!"
            print(status_update)
            return image_obj, status_update
        else:
            raise gr.Error("API call did not return a valid image.")

    except Exception as e:
        print(f"An error occurred: {e}")
        raise gr.Error(f"An error occurred: {e}")

# --- Create the Gradio Interface ---
with gr.Blocks() as demo:
    gr.Markdown("# Text-to-Image Generation UI")
    gr.Markdown("Enter your API key and a prompt to generate an image using the Gitee AI API.")

    with gr.Row():
        with gr.Column(scale=2):
            api_key = gr.Textbox(
                label="API Key",
                placeholder="Enter your Gitee AI API Key here...",
                type="password",
                value="" #  这里填写你的APIkey
            )
            prompt = gr.Textbox(
                label="Prompt",
                lines=5,
                value=DEFAULT_PROMPT
            )
            negative_prompt = gr.Textbox(
                label="Negative Prompt",
                lines=2,
                value=DEFAULT_NEGATIVE_PROMPT
            )
            
            with gr.Row():
                model = gr.Textbox(label="Model", value="z-image-turbo")
                num_steps = gr.Slider(
                    label="Inference Steps",
                    minimum=1,
                    maximum=50,
                    value=9,
                    step=1
                )

            aspect_ratio = gr.Dropdown(
                label="Aspect Ratio Presets",
                choices=list(ASPECT_RATIOS.keys()),
                value="1:1 (1024×1024)",
                interactive=True
            )

            with gr.Row():
                width = gr.Slider(label="Width", minimum=512, maximum=2048, value=1024, step=64)
                height = gr.Slider(label="Height", minimum=512, maximum=2048, value=1024, step=64)

            generate_btn = gr.Button("Generate Image", variant="primary")

        with gr.Column(scale=1):
            output_image = gr.Image(label="Generated Image")
            status_text = gr.Textbox(label="Status", interactive=False)

    # Event handler for aspect ratio selection
    aspect_ratio.change(
        fn=update_dimensions,
        inputs=[aspect_ratio],
        outputs=[width, height]
    )

    generate_btn.click(
        fn=generate_image,
        inputs=[api_key, prompt, negative_prompt, model, width, height, num_steps],
        outputs=[output_image, status_text]
    )

if __name__ == "__main__":
    demo.launch()