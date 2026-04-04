from app.core.dependencies import CurrentUser


def test_admin_check_shape() -> None:
    user = CurrentUser(user_id='u1', email='u@test.com', role='admin')
    assert user.role == 'admin'
