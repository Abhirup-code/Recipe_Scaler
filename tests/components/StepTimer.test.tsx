import { act, fireEvent, render, screen } from "@testing-library/react";
import { StepTimer } from "@/components/StepTimer";

describe("StepTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down, pauses, resumes, and finishes", () => {
    render(<StepTimer minutes={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Start 1 min timer" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("timer")).toHaveTextContent("0:50");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("timer")).toHaveTextContent("0:50");
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    act(() => vi.advanceTimersByTime(50_000));
    expect(screen.getByText("Time's up!")).toBeInTheDocument();
  });

  it("resets to the full time", () => {
    render(<StepTimer minutes={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Start 2 min timer" }));
    act(() => vi.advanceTimersByTime(5_000));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("timer")).toHaveTextContent("2:00");
  });
});
