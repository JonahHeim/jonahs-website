import streamlit as st
from dotenv import load_dotenv

from rag_service import PortfolioRAG, config_from_env

load_dotenv()


st.set_page_config(page_title="Jonah Portfolio AI", page_icon=":robot_face:", layout="centered")
st.title("Jonah Portfolio AI")
st.caption("Retrieval-first assistant that answers from Jonah's own portfolio documents.")


@st.cache_resource
def load_rag() -> PortfolioRAG:
    rag = PortfolioRAG(config_from_env())
    rag.ensure_index()
    return rag


rag = load_rag()

if "history" not in st.session_state:
    st.session_state.history = []

for entry in st.session_state.history:
    with st.chat_message(entry["role"]):
        st.markdown(entry["content"])

question = st.chat_input("Ask about projects, experience, or work style")
if question:
    st.session_state.history.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            result = rag.ask(question, chat_history=st.session_state.history[-8:])
        answer = result["answer"]
        sources = result["sources"]
        st.markdown(answer)
        if sources:
            st.caption("Sources: " + ", ".join(sources))

    st.session_state.history.append({"role": "assistant", "content": answer})
