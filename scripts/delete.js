function Delete(url, page) {
    $.ajax({
        url: '/delete',
        type: 'POST',
        data: JSON.stringify({ url: url, page: page }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(msg) {
            if (msg.ok) alert("Картинка удалена");
            else alert("Ошибка при удалении");
            location.reload();
        },
        error: function(request, status, error) {
            alert(request.responseJSON.msg);
        }
    });
}