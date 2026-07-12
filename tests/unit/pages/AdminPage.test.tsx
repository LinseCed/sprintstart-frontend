import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { AdminPage } from "../../../src/pages/AdminPage";
import { server } from "../setup/vitest.setup";

const adminUsers = [
  {
    id: "user-1",
    authId: "auth-1",
    username: "john.doe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    projectRoles: [{ id: "role-dev", name: "Developer" }],
    permissionGroup: "ADMIN",
    enabled: true,
    profileIcon: null,
    hasCompletedOnboarding: true,
  },
  {
    id: "user-2",
    authId: "auth-2",
    username: "jane.smith",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    projectRoles: [{ id: "role-qa", name: "QA" }],
    permissionGroup: "USER",
    enabled: false,
    profileIcon: null,
    hasCompletedOnboarding: false,
  },
];

function mockAdminUsers() {
  server.use(
    http.get("/api/v1/admin/users", () => HttpResponse.json(adminUsers)),
    http.get("/api/v1/github/pat", () => HttpResponse.json(["default-token"])),
  );
}

describe("AdminPage", () => {
  beforeEach(() => {
    mockAdminUsers();
  });

  it("renders loaded users and filters them by search and status", async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    expect(screen.getByText("Loading admin data...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    await user.type(
      screen.getByRole("textbox", { name: "Search users" }),
      "jane",
    );
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Search users" }));
    await user.click(screen.getByRole("button", { name: "Filter" }));
    await user.click(screen.getByRole("button", { name: "Disabled" }));

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("deletes selected users after confirmation", async () => {
    const user = userEvent.setup();
    const deletedUserIds: string[] = [];

    server.use(
      http.delete("/api/v1/admin/users/:userId", ({ params }) => {
        deletedUserIds.push(String(params.userId));
        return HttpResponse.json({ id: params.userId, deleted: true });
      }),
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("checkbox", { name: "Select John Doe" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Select Jane Smith" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete All" }));

    const dialog = screen.getByRole("alertdialog", {
      name: "Delete selected users?",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Delete All" }),
    );

    await waitFor(() => {
      expect(deletedUserIds).toEqual(["user-1", "user-2"]);
    });

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("loads token names when the token tab is opened", async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Tokens" }));

    await waitFor(() => {
      expect(screen.getByText("default-token")).toBeInTheDocument();
    });
  });
});
