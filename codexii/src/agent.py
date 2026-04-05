import os

from dotenv import load_dotenv
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, cli
from livekit.plugins import google

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful voice AI assistant. The user is interacting with you via voice, even if you perceive the conversation as text.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor.""",
        )


server = AgentServer()


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    api_key = os.getenv("GOOGLE_API_KEY")
    model_name = os.getenv(
        "GOOGLE_REALTIME_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025"
    )

    if api_key and model_name.startswith("gemini-live-"):
        raise ValueError(
            "Model name looks like a Vertex AI Gemini Live model (starts with 'gemini-live-'), "
            "but GOOGLE_API_KEY is set (Gemini API). Use a 'gemini-2.*' model name, or switch "
            "to Vertex AI configuration for Gemini Live."
        )

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Puck",
            model=model_name,
            api_key=api_key,
            temperature=0.8,
            instructions="You are a helpful assistant",
        ),
    )

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        record=False,
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
