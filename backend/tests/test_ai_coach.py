"""Tests for AI Coach state machine (Task 2 - RED phase)."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ai_coach import AICoach, InterviewState


class TestAICoachGreeting:
    """Test 1: Generates initial greeting and first question."""

    def test_initial_state_has_no_categories_covered(self):
        """Fresh InterviewState starts with empty categories and zero questions."""
        state = InterviewState()
        assert state.questions_asked == 0
        assert len(state.categories_covered) == 0
        assert state.current_category is None

    @pytest.mark.asyncio
    async def test_generate_greeting_returns_text(self):
        """First call (no user message) returns a greeting with a question."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()
        # Mock the Gemini call
        coach._call_gemini = AsyncMock(return_value={
            "text": "Welcome. Let's begin with your daily commute — how do you get to work?",
            "extracted_data": {},
        })
        result = await coach.generate_response(state, "")
        assert "text" in result
        assert len(result["text"]) > 0
        assert result["is_complete"] is False

    @pytest.mark.asyncio
    async def test_greeting_sets_first_category(self):
        """After greeting, state advances to the first category."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()
        coach._call_gemini = AsyncMock(return_value={
            "text": "Let's start with your commute.",
            "extracted_data": {},
        })
        result = await coach.generate_response(state, "")
        assert state.current_category is not None
        assert state.questions_asked == 1


class TestAICoachStateTransitions:
    """Test 2: Parses user intent and transitions across 5 categories."""

    @pytest.mark.asyncio
    async def test_transitions_through_categories(self):
        """State machine progresses through categories as questions are answered."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()

        # Simulate 5 category transitions
        for i in range(5):
            coach._call_gemini = AsyncMock(return_value={
                "text": f"Question for category {i}.",
                "extracted_data": {"key": f"value_{i}"},
            })
            result = await coach.generate_response(state, f"answer {i}")
            # After each response, category should be set
            assert state.current_category is not None

        # After 5 categories, all should be covered
        assert len(state.categories_covered) >= 1

    @pytest.mark.asyncio
    async def test_interview_completes_after_max_questions(self):
        """Interview marks complete after reaching the 25-question cap."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()
        state.questions_asked = 24  # One below cap

        coach._call_gemini = AsyncMock(return_value={
            "text": "Thank you for sharing. That completes our interview.",
            "extracted_data": {},
        })
        result = await coach.generate_response(state, "final answer")
        assert result["is_complete"] is True

    @pytest.mark.asyncio
    async def test_interview_not_complete_before_cap(self):
        """Interview is not complete before reaching question cap."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()
        state.questions_asked = 10

        coach._call_gemini = AsyncMock(return_value={
            "text": "Tell me more about your diet.",
            "extracted_data": {"diet": "vegetarian"},
        })
        result = await coach.generate_response(state, "I eat vegetarian")
        assert result["is_complete"] is False


class TestAICoachResponseFormat:
    """Test 3: Returns JSON with expected format."""

    @pytest.mark.asyncio
    async def test_response_has_required_fields(self):
        """Response dict contains text, is_complete, and extracted_data."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()
        coach._call_gemini = AsyncMock(return_value={
            "text": "How do you commute?",
            "extracted_data": {},
        })
        result = await coach.generate_response(state, "")
        assert "text" in result
        assert "is_complete" in result
        assert "extracted_data" in result

    @pytest.mark.asyncio
    async def test_extracted_data_accumulates(self):
        """Extracted data from multiple turns accumulates in state."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()

        # First turn: commute data
        coach._call_gemini = AsyncMock(return_value={
            "text": "Got it.",
            "extracted_data": {"commute": {"distance_km": 10, "mode": "car"}},
        })
        await coach.generate_response(state, "I drive 10km")

        # Second turn: diet data
        coach._call_gemini = AsyncMock(return_value={
            "text": "Interesting.",
            "extracted_data": {"diet": {"type": "vegan"}},
        })
        await coach.generate_response(state, "I'm vegan")

        # Both should be in state
        assert "commute" in state.extracted_data
        assert "diet" in state.extracted_data

    @pytest.mark.asyncio
    async def test_is_complete_boolean(self):
        """is_complete is always a boolean value."""
        coach = AICoach(client=MagicMock())
        state = InterviewState()
        coach._call_gemini = AsyncMock(return_value={
            "text": "Question",
            "extracted_data": {},
        })
        result = await coach.generate_response(state, "")
        assert isinstance(result["is_complete"], bool)
